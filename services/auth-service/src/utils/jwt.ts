import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { JwtPayload, UserRole } from '@exam-platform/shared';
import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';
import { logger } from './logger';

const ACCESS_SECRET = process.env.JWT_SECRET || 'dev-access-secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret';
const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
const REFRESH_EXPIRES_DAYS = 7;

export function signAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES } as jwt.SignOptions);
}

export function signRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId, type: 'refresh' }, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRES,
  } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, ACCESS_SECRET) as JwtPayload;
}

export function verifyRefreshToken(token: string): { sub: string } {
  return jwt.verify(token, REFRESH_SECRET) as { sub: string };
}

export async function issueTokenPair(user: {
  id: string;
  email: string;
  role: { name: string };
}) {
  const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
    sub: user.id,
    email: user.email,
    role: user.role.name as UserRole,
  };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(user.id);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_EXPIRES_DAYS);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt,
    },
  });

  return { accessToken, refreshToken, expiresIn: 900 }; // 15 min in seconds
}

export async function revokeRefreshToken(token: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { token },
    data: { revokedAt: new Date() },
  });
}

export async function blacklistAccessToken(token: string, expiresIn: number): Promise<void> {
  try {
    await redis.set(`blacklist:${token}`, '1', 'EX', expiresIn);
  } catch (err) {
    logger.warn('Redis unavailable, skipping blacklist set');
  }
}

export async function isTokenBlacklisted(token: string): Promise<boolean> {
  try {
    const result = await redis.get(`blacklist:${token}`);
    return result !== null;
  } catch (err) {
    logger.warn('Redis unavailable, returning false for blacklist check');
    return false;
  }
}
