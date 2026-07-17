import { Router, Response, NextFunction } from 'express';
import { CreateQuestionSchema, UserRole } from '@exam-platform/shared';
import { authenticate, requireRole, AuthRequest } from '../middleware/rbac';
import { prisma } from '../lib/prisma';

export const questionRouter = Router();

// POST /questions
questionRouter.post('/', authenticate, requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TEACHER), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = CreateQuestionSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ success: false, error: result.error.flatten() });
      return;
    }

    const question = await prisma.question.create({ data: result.data });
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

    const created = await prisma.question.createMany({ data: questions });
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
      data: { ...req.body, updatedAt: new Date() },
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
