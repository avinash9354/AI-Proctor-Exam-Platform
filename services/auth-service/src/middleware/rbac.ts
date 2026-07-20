import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, isTokenBlacklisted } from '../utils/jwt';
import { UserRole } from '@exam-platform/shared';
import { prisma } from '../lib/prisma';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
}

// ─── Authenticate ─────────────────────────────────────────────────────────────
export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Missing or invalid authorization header' });
    return;
  }

  const token = authHeader.slice(7);

  try {
    // Check blacklist first
    if (await isTokenBlacklisted(token)) {
      res.status(401).json({ success: false, error: 'Token has been revoked' });
      return;
    }

    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}

// ─── RBAC ─────────────────────────────────────────────────────────────────────
export function requireRole(...roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthenticated' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ success: false, error: 'Insufficient permissions' });
      return;
    }
    next();
  };
}

// ─── Permission Check (resource + action) ────────────────────────────────────
function requirePermission(resource: string, action: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthenticated' });
      return;
    }

    // super_admin and admin bypass permission checks
    if (req.user.role === UserRole.SUPER_ADMIN || req.user.role === UserRole.ADMIN) {
      next();
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        role: {
          include: { permissions: true },
        },
      },
    });

    const hasPermission = user?.role.permissions.some(
      (p) =>
        (p.resource === '*' || p.resource === resource) &&
        (p.action === '*' || p.action === action)
    );

    if (!hasPermission) {
      res.status(403).json({ success: false, error: 'Insufficient permissions' });
      return;
    }

    next();
  };
}
