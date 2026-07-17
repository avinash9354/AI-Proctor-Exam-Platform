import jwt from 'jsonwebtoken';
import { JwtPayload } from '@exam-platform/shared';
import { redis } from '../lib/redis';
import { logger } from './logger';

const ACCESS_SECRET = process.env.JWT_SECRET || 'dev-access-secret';

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, ACCESS_SECRET) as JwtPayload;
}

export async function isTokenBlacklisted(token: string): Promise<boolean> {
  try {
    const result = await redis.get(`blacklist:${token}`);
    return result !== null;
  } catch {
    logger.warn('Redis unavailable, returning false for blacklist check');
    return false;
  }
}
