import { Router, Response, NextFunction } from 'express';
import { UserRole, UnblockSessionSchema, SessionStatus, RiskLevel } from '@exam-platform/shared';
import { authenticate, requireRole, AuthRequest } from '../middleware/rbac';
import { prisma } from '../lib/prisma';
import { transitionSession } from '../modules/exam/examStateMachine';
import { MAX_MONITORING_TILES } from '@exam-platform/shared';

export const adminRouter = Router();

// All admin routes require authentication + admin role
adminRouter.use(authenticate, requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TEACHER));

// GET /admin/sessions — live monitoring grid with cursor pagination
adminRouter.get('/sessions', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { filter, examId, cursor, limit = String(MAX_MONITORING_TILES) } = req.query;
    const take = Math.min(parseInt(limit as string, 10), MAX_MONITORING_TILES);

    const where: Record<string, unknown> = {
      status: SessionStatus.IN_PROGRESS,
      ...(examId ? { examId } : {}),
      ...(cursor ? { id: { lt: cursor as string } } : {}),
    };

    // Filters
    if (filter === 'high_risk') {
      where.riskLevel = { in: [RiskLevel.ORANGE, RiskLevel.RED] };
    } else if (filter === 'phone_detected') {
      where.aiEvents = { some: { eventType: 'PHONE_DETECTED' } };
    } else if (filter === 'multiple_faces') {
      where.aiEvents = { some: { eventType: 'MULTIPLE_FACES' } };
    } else if (filter === 'warnings') {
      where.warningCount = { gte: 1 };
    }

    const sessions = await prisma.examSession.findMany({
      where,
      take,
      orderBy: [{ riskScore: 'desc' }, { updatedAt: 'desc' }],
      include: {
        student: { select: { name: true, rollNumber: true, photoUrl: true } },
        exam: { select: { title: true } },
        _count: { select: { violations: true, aiEvents: true } },
      },
    });

    const nextCursor = sessions.length === take ? sessions[sessions.length - 1].id : undefined;

    res.json({
      success: true,
      data: {
        sessions,
        nextCursor,
        hasMore: !!nextCursor,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /admin/sessions/:id/unblock — admin override
adminRouter.post('/sessions/:id/unblock', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = UnblockSessionSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ success: false, error: result.error.flatten() });
      return;
    }

    const { reason, extraTimeMinutes } = result.data;
    const session = await prisma.examSession.findUnique({ where: { id: req.params.id } });
    if (!session) {
      res.status(404).json({ success: false, error: 'Session not found' });
      return;
    }

    await transitionSession(req.params.id, SessionStatus.IN_PROGRESS, {
      adminId: req.user!.id,
      reason,
    });

    // Reset block state
    await prisma.examSession.update({
      where: { id: req.params.id },
      data: { isBlocked: false, warningCount: 0 },
    });

    res.json({ success: true, data: { status: 'resumed', extraTimeMinutes } });
  } catch (err) {
    next(err);
  }
});

// POST /admin/sessions/:id/force-submit
adminRouter.post('/sessions/:id/force-submit', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { reason } = req.body;
    if (!reason || reason.length < 10) {
      res.status(400).json({ success: false, error: 'Reason (min 10 chars) is required' });
      return;
    }

    await transitionSession(req.params.id, SessionStatus.AUTO_SUBMITTED, {
      adminId: req.user!.id,
      reason,
    });

    res.json({ success: true, data: { status: 'auto_submitted' } });
  } catch (err) {
    next(err);
  }
});

// POST /admin/sessions/:id/extend-time
adminRouter.post('/sessions/:id/extend-time', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { extraMinutes, reason } = req.body;
    if (!extraMinutes || !reason) {
      res.status(400).json({ success: false, error: 'extraMinutes and reason are required' });
      return;
    }

    await prisma.auditLog.create({
      data: {
        adminId: req.user!.id,
        action: `extend_time:+${extraMinutes}min`,
        targetSessionId: req.params.id,
        reason,
      },
    });

    res.json({ success: true, data: { extraMinutes, reason } });
  } catch (err) {
    next(err);
  }
});

// POST /admin/violations/:id/review — mark violation as confirmed/FP/needs-review
adminRouter.post('/violations/:id/review', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, notes } = req.body;
    if (!['confirmed', 'false_positive', 'needs_review'].includes(status)) {
      res.status(400).json({ success: false, error: 'Invalid status' });
      return;
    }

    const violation = await prisma.violation.update({
      where: { id: req.params.id },
      data: {
        status,
        reviewedBy: req.user!.id,
        reviewNotes: notes,
        reviewedAt: new Date(),
      },
    });

    // If false positive, reduce risk score
    if (status === 'false_positive') {
      const session = await prisma.examSession.findUnique({ where: { id: violation.sessionId } });
      if (session) {
        const { DEFAULT_RISK_WEIGHTS } = await import('@exam-platform/shared');
        const { calculateRiskLevel } = await import('../modules/risk/riskEngine');
        const weight = DEFAULT_RISK_WEIGHTS[violation.type as keyof typeof DEFAULT_RISK_WEIGHTS] || 0;
        const reduction = Math.round(weight * violation.confidence);
        const newScore = Math.max(0, session.riskScore - reduction);
        await prisma.examSession.update({
          where: { id: violation.sessionId },
          data: { riskScore: newScore, riskLevel: calculateRiskLevel(newScore) },
        });
      }
    }

    res.json({ success: true, data: violation });
  } catch (err) {
    next(err);
  }
});

// GET /admin/audit-logs
adminRouter.get('/audit-logs', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { sessionId, page = '1' } = req.query;
    const take = 50;
    const skip = (parseInt(page as string, 10) - 1) * take;

    const logs = await prisma.auditLog.findMany({
      where: sessionId ? { targetSessionId: sessionId as string } : {},
      include: { admin: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    });

    res.json({ success: true, data: logs });
  } catch (err) {
    next(err);
  }
});

// GET /admin/analytics/exam/:examId
adminRouter.get('/analytics/exam/:examId', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { examId } = req.params;

    const [sessions, violations] = await Promise.all([
      prisma.examSession.findMany({
        where: { examId },
        include: { submissions: { select: { score: true } } },
      }),
      prisma.violation.findMany({
        where: { session: { examId } },
        select: { type: true, status: true },
      }),
    ]);

    const completedSessions = sessions.filter((s) =>
      ['submitted', 'auto_submitted'].includes(s.status)
    );

    const violationsByType = violations.reduce<Record<string, number>>((acc, v) => {
      acc[v.type] = (acc[v.type] || 0) + 1;
      return acc;
    }, {});

    const avgRiskScore = sessions.length
      ? Math.round(sessions.reduce((a, s) => a + s.riskScore, 0) / sessions.length)
      : 0;

    res.json({
      success: true,
      data: {
        examId,
        totalStudents: sessions.length,
        completedSessions: completedSessions.length,
        averageRiskScore: avgRiskScore,
        violationsByType,
        riskDistribution: {
          green: sessions.filter((s) => s.riskLevel === 'green').length,
          yellow: sessions.filter((s) => s.riskLevel === 'yellow').length,
          orange: sessions.filter((s) => s.riskLevel === 'orange').length,
          red: sessions.filter((s) => s.riskLevel === 'red').length,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});
