import { Router, Request, Response } from 'express';
import { io } from '../index';
import { logger } from '../utils/logger';

export const notifyRouter = Router();

// POST /notify/admin — called internally by exam-service when AI events fire
notifyRouter.post('/admin', async (req: Request, res: Response) => {
  try {
    const { type, examId, payload } = req.body;

    if (!type || !payload) {
      res.status(400).json({ success: false, error: 'type and payload required' });
      return;
    }

    const event = {
      type,
      payload,
      timestamp: new Date().toISOString(),
    };

    // Broadcast to all admins watching this exam
    if (examId) {
      io.to(`exam:${examId}`).emit('admin:notification', event);
    }

    // Also broadcast to session-specific room
    if (payload.sessionId) {
      io.to(`session:${payload.sessionId}`).emit('session:update', event);
    }

    // High-priority: broadcast globally to all connected admins for red alerts
    if (payload.riskLevel === 'red' || type === 'session_blocked') {
      io.emit('admin:high_priority', event);
    }

    logger.info(`Notification emitted: type=${type} examId=${examId}`);
    res.json({ success: true, data: { emitted: true } });
  } catch (err) {
    logger.error('Notification error:', err);
    res.status(500).json({ success: false, error: 'Failed to send notification' });
  }
});

// POST /notify/student — send a message to a specific student session
notifyRouter.post('/student', async (req: Request, res: Response) => {
  try {
    const { sessionId, type, message } = req.body;
    io.to(`session:${sessionId}`).emit('student:notification', { type, message, timestamp: new Date().toISOString() });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to notify student' });
  }
});

// In-memory store of recent system and exam alerts for instant delivery
const recentNotifications: Array<{
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}> = [
  {
    id: 'notif-1',
    title: 'Welcome to ExamGuard Portal',
    message: 'Your system setup and biometric profile are ready. Check compatibility before starting examinations.',
    type: 'system',
    read: false,
    createdAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
  },
  {
    id: 'notif-2',
    title: 'Upcoming Exam Reminder',
    message: 'Advanced Software Architecture examination window opens soon. Please ensure your secure browser is updated.',
    type: 'exam',
    read: false,
    createdAt: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
  },
  {
    id: 'notif-3',
    title: 'AI Proctoring Policy Notice',
    message: 'Strict multi-angle monitoring (Webcam + Mobile QR) is active for high-security assessments.',
    type: 'alert',
    read: true,
    createdAt: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
  },
];

// GET / — return notification feed
notifyRouter.get('/', async (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      notifications: recentNotifications,
      unreadCount: recentNotifications.filter((n) => !n.read).length,
    },
  });
});

// PATCH /:id/read — mark as read
notifyRouter.patch('/:id/read', async (req: Request, res: Response) => {
  const { id } = req.params;
  const notif = recentNotifications.find((n) => n.id === id);
  if (notif) notif.read = true;
  res.json({ success: true, data: { id, read: true } });
});
