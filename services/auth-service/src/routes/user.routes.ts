import { Router, Response, NextFunction } from 'express';
import { authenticate, requireRole, AuthRequest } from '../middleware/rbac';
import { prisma } from '../lib/prisma';
import { UserRole } from '@exam-platform/shared';

export const userRouter = Router();

// ─── GET /users/profile ───────────────────────────────────────────────────────
userRouter.get('/profile', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { role: true },
      omit: { passwordHash: true },
    });
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /users/profile ─────────────────────────────────────────────────────
userRouter.patch('/profile', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, department, semester, photoUrl } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { name, department, semester, photoUrl, updatedAt: new Date() },
      omit: { passwordHash: true },
    });
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

// ─── GET /users (admin only) ──────────────────────────────────────────────────
userRouter.get('/', authenticate, requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { role, search, page = '1' } = req.query;
    const take = 20;
    const skip = (parseInt(page as string, 10) - 1) * take;

    const users = await prisma.user.findMany({
      where: {
        ...(role ? { role: { name: role as string } } : {}),
        ...(search ? {
          OR: [
            { name: { contains: search as string, mode: 'insensitive' } },
            { email: { contains: search as string, mode: 'insensitive' } },
            { rollNumber: { contains: search as string, mode: 'insensitive' } },
          ],
        } : {}),
      },
      include: { role: true },
      omit: { passwordHash: true },
      take,
      skip,
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
});

// ─── POST /users/verify-token (internal service-to-service use) ───────────────
userRouter.post('/verify-token', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { token } = req.body;
    if (!token) {
      res.status(400).json({ success: false, error: 'Token required' });
      return;
    }

    const { verifyAccessToken } = await import('../utils/jwt');
    const { isTokenBlacklisted } = await import('../utils/jwt');

    const blacklisted = await isTokenBlacklisted(token);
    if (blacklisted) {
      res.status(401).json({ success: false, error: 'Token revoked' });
      return;
    }

    const payload = verifyAccessToken(token);
    res.json({ success: true, data: payload });
  } catch {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
});
