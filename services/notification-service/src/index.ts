import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import cors from 'cors';
import helmet from 'helmet';
import { notifyRouter } from './routes/notify.routes';
import { logger } from './utils/logger';

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 4004;

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// ─── Redis Adapter for Socket.IO (with local memory fallback) ────────────────
const pubClient = new Redis(REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1 });
const subClient = pubClient.duplicate();

pubClient.on('error', (err) => logger.warn('Redis pubClient error (using in-memory fallback):', err.message));
subClient.on('error', (err) => logger.warn('Redis subClient error:', err.message));

export const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

pubClient.connect().then(() => {
  subClient.connect().then(() => {
    io.adapter(createAdapter(pubClient, subClient));
    logger.info('✅ Socket.IO Redis adapter attached');
  });
}).catch(() => {
  logger.info('ℹ️ Redis unavailable, Socket.IO running with in-memory adapter');
});

// ─── Socket.IO Connection Handler ─────────────────────────────────────────────
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  // Admin subscribes to exam room
  socket.on('join:exam', (examId: string) => {
    socket.join(`exam:${examId}`);
    logger.info(`Socket ${socket.id} joined exam room: ${examId}`);
  });

  // Admin subscribes to session room
  socket.on('join:session', (sessionId: string) => {
    socket.join(`session:${sessionId}`);
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'notification-service', timestamp: new Date().toISOString() });
});

app.use('/v1/notify', notifyRouter);

httpServer.listen(PORT, () => {
  logger.info(`🚀 Notification service running on port ${PORT}`);
});

export { app };
