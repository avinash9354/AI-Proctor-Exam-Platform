import { PrismaClient } from '@exam-platform/database';
import { logger } from '../utils/logger';

declare global {
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ??
  new PrismaClient({
    datasourceUrl: 'file:/Users/avinash/Desktop/App 2/packages/database/prisma/dev.db',
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

process.on('beforeExit', async () => {
  await prisma.$disconnect();
  logger.info('Prisma disconnected');
});
