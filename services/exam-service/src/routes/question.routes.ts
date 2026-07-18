import { Router, Response, NextFunction } from 'express';
import { CreateQuestionSchema, UserRole } from '@exam-platform/shared';
import { authenticate, requireRole, AuthRequest } from '../middleware/rbac';
import { prisma } from '../lib/prisma';

export const questionRouter = Router();

// GET /questions — list all questions (with optional filtering)
questionRouter.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { type, difficulty } = req.query;
    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (difficulty) where.difficulty = difficulty;

    const questions = await prisma.question.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const parsed = questions.map((q) => {
      let parsedPayload = q.payload;
      if (typeof q.payload === 'string') {
        try { parsedPayload = JSON.parse(q.payload); } catch {}
      }
      return { ...q, payload: parsedPayload };
    });

    res.json({ success: true, data: parsed });
  } catch (err) {
    next(err);
  }
});

// POST /questions
questionRouter.post('/', authenticate, requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TEACHER), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = CreateQuestionSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ success: false, error: result.error.flatten() });
      return;
    }

    const questionData = {
      ...result.data,
      payload: typeof result.data.payload === 'string'
        ? result.data.payload
        : JSON.stringify(result.data.payload),
    };
    const question = await prisma.question.create({ data: questionData });
    res.status(201).json({ success: true, data: question });
  } catch (err) {
    next(err);
  }
});

// POST /questions/bulk — batch import
questionRouter.post('/bulk', authenticate, requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TEACHER), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { questions } = req.body;
    if (!Array.isArray(questions) || questions.length === 0) {
      res.status(400).json({ success: false, error: 'questions array required' });
      return;
    }

    const formattedQuestions = questions.map((q: Record<string, unknown>) => ({
      ...q,
      payload: typeof q.payload === 'string' ? q.payload : JSON.stringify(q.payload),
    })) as any[];
    const created = await prisma.question.createMany({ data: formattedQuestions });
    res.status(201).json({ success: true, data: { count: created.count } });
  } catch (err) {
    next(err);
  }
});

// PATCH /questions/:id
questionRouter.patch('/:id', authenticate, requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TEACHER), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const question = await prisma.question.update({
      where: { id: req.params.id },
      data: {
        ...req.body,
        payload: req.body.payload && typeof req.body.payload !== 'string'
          ? JSON.stringify(req.body.payload)
          : req.body.payload,
        updatedAt: new Date(),
      },
    });
    res.json({ success: true, data: question });
  } catch (err) {
    next(err);
  }
});

// DELETE /questions/:id
questionRouter.delete('/:id', authenticate, requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.question.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Question deleted' });
  } catch (err) {
    next(err);
  }
});
