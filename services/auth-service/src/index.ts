import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { authRouter } from './routes/auth.routes';
import { userRouter } from './routes/user.routes';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { prisma } from './lib/prisma';
import { connectRedis } from './lib/redis';

const app = express();
const PORT = process.env.PORT || 4001;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
}));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'auth-service', timestamp: new Date().toISOString() });
});

app.use('/v1/auth', authRouter);
app.use('/v1/users', userRouter);

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────────────────
async function start() {
  try {
    await prisma.$connect();
    logger.info('✅ Database connected');
    await connectRedis();
    app.listen(PORT, () => {
      logger.info(`🚀 Auth service running on port ${PORT}`);
    });
  } catch (err) {
    logger.error('❌ Failed to start auth service:', err);
    process.exit(1);
  }
}

start();
