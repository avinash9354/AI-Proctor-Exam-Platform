import { Router, Response, NextFunction } from 'express';
import { CreateExamSchema } from '@exam-platform/shared';
import { authenticate, requireRole, AuthRequest } from '../middleware/rbac';
import { UserRole } from '@exam-platform/shared';
import { prisma } from '../lib/prisma';

export const examRouter = Router();

// GET /exams?status=upcoming|completed|all
examRouter.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status = 'all' } = req.query;
    const now = new Date();

    const where: Record<string, unknown> = { isPublished: true };
    if (status === 'upcoming') where.startTime = { gte: now };
    if (status === 'live') {
      where.startTime = { lte: now };
      where.endTime = { gte: now };
    }
    if (status === 'completed') where.endTime = { lte: now };

    // Students only see exams they're enrolled in
    if (req.user?.role === UserRole.STUDENT) {
      where.enrollments = { some: { studentId: req.user.id } };
    }

    const exams = await prisma.exam.findMany({
      where,
      include: {
        _count: { select: { questions: true, sessions: true } },
      },
      orderBy: { startTime: 'asc' },
    });

    res.json({ success: true, data: exams });
  } catch (err) {
    next(err);
  }
});

// GET /exams/:id
examRouter.get('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const exam = await prisma.exam.findUnique({
      where: { id: req.params.id },
      include: {
        _count: { select: { questions: true } },
      },
    });
    if (!exam) {
      res.status(404).json({ success: false, error: 'Exam not found' });
      return;
    }
    res.json({ success: true, data: exam });
  } catch (err) {
    next(err);
  }
});

// POST /exams — admin/teacher only
examRouter.post('/', authenticate, requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TEACHER), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = CreateExamSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ success: false, error: result.error.flatten() });
      return;
    }

    const exam = await prisma.exam.create({
      data: {
        ...result.data,
        startTime: new Date(result.data.startTime),
        endTime: new Date(result.data.endTime),
        createdBy: req.user!.id,
        policyConfig: typeof result.data.policyConfig === 'string'
          ? result.data.policyConfig
          : JSON.stringify(result.data.policyConfig || {}),
      },
    });

    res.status(201).json({ success: true, data: exam });
  } catch (err) {
    next(err);
  }
});

// PATCH /exams/:id
examRouter.patch('/:id', authenticate, requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TEACHER), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const exam = await prisma.exam.update({
      where: { id: req.params.id },
      data: {
        ...req.body,
        policyConfig: req.body.policyConfig && typeof req.body.policyConfig !== 'string'
          ? JSON.stringify(req.body.policyConfig)
          : req.body.policyConfig,
        updatedAt: new Date(),
      },
    });
    res.json({ success: true, data: exam });
  } catch (err) {
    next(err);
  }
});

// DELETE /exams/:id
examRouter.delete('/:id', authenticate, requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.exam.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Exam deleted' });
  } catch (err) {
    next(err);
  }
});

// GET /exams/:id/questions — returns questions for the exam
examRouter.get('/:id/questions', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const isStudent = req.user?.role === UserRole.STUDENT;
    const questions = await prisma.question.findMany({
      where: { examId: req.params.id },
      orderBy: { order: 'asc' },
    });

    // Strip correct answers for students
    const sanitized = isStudent
      ? questions.map((q) => {
          const parsedPayload = typeof q.payload === 'string' ? JSON.parse(q.payload) : (q.payload || {});
          return {
            ...q,
            payload: sanitizeQuestionForStudent(parsedPayload as Record<string, unknown>),
          };
        })
      : questions.map((q) => ({
          ...q,
          payload: typeof q.payload === 'string' ? JSON.parse(q.payload) : (q.payload || {}),
        }));

    res.json({ success: true, data: sanitized });
  } catch (err) {
    next(err);
  }
});

function sanitizeQuestionForStudent(payload: Record<string, unknown>): Record<string, unknown> {
  if (payload.type === 'mcq' || payload.type === 'msq') {
    const options = (payload.options as Array<{ id: string; text: string; isCorrect: boolean }>)?.map(
      ({ isCorrect: _, ...opt }) => opt
    );
    const { explanation: _exp, ...rest } = payload;
    return { ...rest, options };
  }
  if (payload.type === 'coding') {
    const testCases = (payload.testCases as Array<{ isHidden: boolean }>)?.filter((tc) => !tc.isHidden);
    return { ...payload, testCases };
  }
  return payload;
}
