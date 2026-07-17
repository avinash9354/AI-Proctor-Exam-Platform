import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { examRouter } from './routes/exam.routes';
import { sessionRouter } from './routes/session.routes';
import { aiEventRouter } from './routes/aiEvent.routes';
import { adminRouter } from './routes/admin.routes';
import { questionRouter } from './routes/question.routes';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { prisma } from './lib/prisma';

const app = express();
const PORT = process.env.PORT || 4002;

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
}));
app.use(express.json({ limit: '10kb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'exam-service', timestamp: new Date().toISOString() });
});

app.use('/v1/exams', examRouter);
app.use('/v1/questions', questionRouter);
app.use('/v1/sessions', sessionRouter);
app.use('/v1/ai', aiEventRouter);
app.use('/v1/admin', adminRouter);

app.use(errorHandler);

async function start() {
  await prisma.$connect();
  logger.info('✅ Database connected');
  app.listen(PORT, () => logger.info(`🚀 Exam service running on port ${PORT}`));
}

start().catch((err) => { logger.error(err); process.exit(1); });
