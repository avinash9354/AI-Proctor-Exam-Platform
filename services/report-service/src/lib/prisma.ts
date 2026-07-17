import { PrismaClient } from '@exam-platform/database';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasourceUrl: 'file:/Users/avinashpandey/Desktop/App/packages/database/prisma/dev.db',
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
