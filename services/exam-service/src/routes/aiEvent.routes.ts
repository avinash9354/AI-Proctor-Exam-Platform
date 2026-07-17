import { Router, Response, NextFunction } from 'express';
import { AIEventSchema } from '@exam-platform/shared';
import { processAIEvent } from '../modules/risk/riskEngine';
import { authenticate, AuthRequest } from '../middleware/rbac';

export const aiEventRouter = Router();

// POST /ai/events — called by the Python AI service (internal)
aiEventRouter.post('/events', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Simple API key check for internal service-to-service auth
    const apiKey = req.headers['x-internal-key'];
    if (apiKey !== process.env.INTERNAL_API_KEY && process.env.NODE_ENV !== 'development') {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const result = AIEventSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ success: false, error: result.error.flatten() });
      return;
    }

    const engineResult = await processAIEvent(result.data);

    res.status(202).json({
      success: true,
      data: engineResult,
    });
  } catch (err) {
    next(err);
  }
});

// GET /ai/events/:sessionId — admin view of AI events for a session
aiEventRouter.get('/events/:sessionId', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;
    const { limit = '50', cursor } = req.query;

    const events = await (await import('../lib/prisma')).prisma.aIEvent.findMany({
      where: {
        sessionId,
        ...(cursor ? { id: { lt: cursor as string } } : {}),
      },
      take: parseInt(limit as string, 10),
      orderBy: { timestamp: 'desc' },
    });

    res.json({ success: true, data: events });
  } catch (err) {
    next(err);
  }
});
