import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import rateLimit from 'express-rate-limit';
import { SignupSchema, LoginSchema, RefreshTokenSchema } from '@exam-platform/shared';
import { prisma } from '../lib/prisma';
import { issueTokenPair, verifyRefreshToken, revokeRefreshToken, blacklistAccessToken } from '../utils/jwt';
import { authenticate, AuthRequest } from '../middleware/rbac';
import { logger } from '../utils/logger';

export const authRouter = Router();

// ─── Rate Limiters ────────────────────────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 5000, // Increased for demo/dev testing
  message: { success: false, error: 'Too many login attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5000, // Increased for demo/dev testing
  message: { success: false, error: 'Too many signup attempts, please try again later' },
});

// ─── POST /auth/signup ────────────────────────────────────────────────────────
authRouter.post('/signup', signupLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = SignupSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ success: false, error: result.error.flatten() });
      return;
    }

    const { name, email, password, role, rollNumber, department, semester } = result.data;

    const existing = await prisma.user.findUnique({ where: { email }, include: { role: true } });
    if (existing) {
      const passwordMatch = await bcrypt.compare(password, existing.passwordHash);
      if (passwordMatch && existing.isActive) {
        await prisma.user.update({
          where: { id: existing.id },
          data: { lastLoginAt: new Date() },
        });
        const tokens = await issueTokenPair(existing);
        logger.info(`User auto-logged in during signup: ${email}`);
        res.status(200).json({
          success: true,
          data: {
            user: {
              id: existing.id,
              name: existing.name,
              email: existing.email,
              role: existing.role.name,
              rollNumber: existing.rollNumber,
              department: existing.department,
              semester: existing.semester,
              photoUrl: existing.photoUrl,
            },
            ...tokens,
          },
        });
        return;
      }
      res.status(409).json({ success: false, error: 'Email already registered. Please sign in.' });
      return;
    }

    const dbRole = await prisma.role.findFirst({ where: { name: role } });
    if (!dbRole) {
      res.status(400).json({ success: false, error: 'Invalid role' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, passwordHash, roleId: dbRole.id, rollNumber, department, semester },
      include: { role: true },
    });

    const tokens = await issueTokenPair(user);
    logger.info(`User signed up: ${email} (${role})`);

    res.status(201).json({
      success: true,
      data: {
        user: { id: user.id, name: user.name, email: user.email, role: user.role.name },
        ...tokens,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /auth/login ─────────────────────────────────────────────────────────
authRouter.post('/login', loginLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = LoginSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ success: false, error: result.error.flatten() });
      return;
    }

    const { email, password } = result.data;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });

    if (!user || !user.isActive) {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await issueTokenPair(user);
    logger.info(`User logged in: ${email}`);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role.name,
          rollNumber: user.rollNumber,
          department: user.department,
          semester: user.semester,
          photoUrl: user.photoUrl,
        },
        ...tokens,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /auth/refresh ───────────────────────────────────────────────────────
authRouter.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = RefreshTokenSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ success: false, error: 'Missing refresh token' });
      return;
    }

    const { refreshToken } = result.data;

    let payload: { sub: string };
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      res.status(401).json({ success: false, error: 'Invalid or expired refresh token' });
      return;
    }

    const storedToken = await prisma.refreshToken.findFirst({
      where: { token: refreshToken, revokedAt: null },
      include: { user: { include: { role: true } } },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      res.status(401).json({ success: false, error: 'Refresh token expired or revoked' });
      return;
    }

    // Rotate refresh token
    await revokeRefreshToken(refreshToken);
    const tokens = await issueTokenPair(storedToken.user);

    res.json({ success: true, data: tokens });
  } catch (err) {
    next(err);
  }
});

// ─── POST /auth/logout ────────────────────────────────────────────────────────
authRouter.post('/logout', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.slice(7) || '';
    const { refreshToken } = req.body;

    // Blacklist the access token for its remaining TTL
    await blacklistAccessToken(token, 900);

    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }

    logger.info(`User logged out: ${req.user?.email}`);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
});

// ─── GET /auth/me ─────────────────────────────────────────────────────────────
authRouter.get('/me', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { role: true },
      omit: { passwordHash: true },
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    res.json({ success: true, data: { ...user, role: user.role.name } });
  } catch (err) {
    next(err);
  }
});
