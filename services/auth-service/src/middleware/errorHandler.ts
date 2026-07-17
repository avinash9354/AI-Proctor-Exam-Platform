import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export function errorHandler(
  err: Error & { status?: number; code?: string },
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.error(`[${req.method}] ${req.path} - ${err.message}`, { stack: err.stack });

  const status = err.status || 500;
  res.status(status).json({
    success: false,
    error: status === 500 ? 'Internal server error' : err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}
