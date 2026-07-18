import { Router, Response, NextFunction } from 'express';
import { StartSessionSchema, SubmitAnswerSchema } from '@exam-platform/shared';
import { SessionStatus, UserRole } from '@exam-platform/shared';
import { authenticate, requireRole, AuthRequest } from '../middleware/rbac';
import { prisma } from '../lib/prisma';
import { transitionSession } from '../modules/exam/examStateMachine';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

export const sessionRouter = Router();

// POST /sessions/start
sessionRouter.post('/start', authenticate, requireRole(UserRole.STUDENT), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = StartSessionSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ success: false, error: result.error.flatten() });
      return;
    }

    const { examId, consentGiven, deviceInfo } = result.data;

    // Verify exam exists and is active
    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) {
      res.status(404).json({ success: false, error: 'Exam not found' });
      return;
    }

    const now = new Date();
    const policyConfig = (typeof exam.policyConfig === 'string'
      ? JSON.parse(exam.policyConfig)
      : (exam.policyConfig || {})) as Record<string, unknown>;
    const lateJoinWindow = ((policyConfig.allowedLateJoinMinutes as number) || 10) * 60 * 1000;
    if (now < exam.startTime || now > new Date(exam.endTime.getTime() + lateJoinWindow)) {
      res.status(400).json({ success: false, error: 'Exam is not currently active' });
      return;
    }

    // Check enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: { examId_studentId: { examId, studentId: req.user!.id } },
    });
    if (!enrollment) {
      res.status(403).json({ success: false, error: 'Not enrolled in this exam' });
      return;
    }

    // Upsert session (idempotent — student may reconnect)
    let session = await prisma.examSession.findUnique({
      where: { examId_studentId: { examId, studentId: req.user!.id } },
    });

    if (!session) {
      session = await prisma.examSession.create({
        data: {
          examId,
          studentId: req.user!.id,
          status: SessionStatus.NOT_STARTED,
          consentGiven,
          consentAt: consentGiven ? new Date() : undefined,
          consentIp: req.ip,
          deviceInfo: deviceInfo ? (typeof deviceInfo === 'string' ? deviceInfo : JSON.stringify(deviceInfo)) : undefined,
          streamToken: uuidv4(),
        },
      });
    }

    if (session.status === SessionStatus.NOT_STARTED) {
      await transitionSession(session.id, SessionStatus.IN_PROGRESS);
    }

    // Return session info + websocket token
    res.json({
      success: true,
      data: {
        sessionId: session.id,
        status: SessionStatus.IN_PROGRESS,
        streamToken: session.streamToken,
        riskScore: session.riskScore,
        examDurationMinutes: exam.durationMinutes,
        startedAt: session.startedAt || new Date(),
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /sessions/:id/heartbeat
sessionRouter.post('/:id/heartbeat', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.examSession.update({
      where: { id },
      data: { updatedAt: new Date() },
    });
    res.json({ success: true, data: { ack: true, timestamp: new Date().toISOString() } });
  } catch (err) {
    next(err);
  }
});

// POST /sessions/:id/submit
sessionRouter.post('/:id/submit', authenticate, requireRole(UserRole.STUDENT), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const session = await prisma.examSession.findUnique({ where: { id } });
    if (!session || session.studentId !== req.user!.id) {
      res.status(404).json({ success: false, error: 'Session not found' });
      return;
    }

    await transitionSession(id, SessionStatus.SUBMITTED);
    res.json({ success: true, data: { status: 'submitted', endedAt: new Date() } });
  } catch (err) {
    next(err);
  }
});

// POST /sessions/:id/answer — save/update a single answer (autosave)
sessionRouter.post('/:id/answer', authenticate, requireRole(UserRole.STUDENT), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id: sessionId } = req.params;
    const result = SubmitAnswerSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ success: false, error: result.error.flatten() });
      return;
    }

    const { questionId, answer, timeSpentSeconds } = result.data;

    const submission = await prisma.submission.upsert({
      where: { sessionId_questionId: { sessionId, questionId } },
      update: {
        answer: typeof answer === 'string' ? answer : JSON.stringify(answer),
        timeSpentSeconds,
        updatedAt: new Date(),
      },
      create: {
        sessionId,
        questionId,
        answer: typeof answer === 'string' ? answer : JSON.stringify(answer),
        timeSpentSeconds,
      },
    });

    res.json({ success: true, data: { id: submission.id, savedAt: new Date() } });
  } catch (err) {
    next(err);
  }
});

// GET /sessions/my — get all sessions for the authenticated student
sessionRouter.get('/my', authenticate, requireRole(UserRole.STUDENT), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const sessions = await prisma.examSession.findMany({
      where: { studentId: req.user!.id },
      orderBy: { updatedAt: 'desc' },
      include: {
        exam: { select: { title: true, durationMinutes: true, policyConfig: true } },
        submissions: true,
        _count: { select: { violations: true, aiEvents: true } },
      },
    });
    res.json({ success: true, data: { sessions } });
  } catch (err) {
    next(err);
  }
});

// GET /sessions/:id — get session + submissions for student
sessionRouter.get('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const session = await prisma.examSession.findUnique({
      where: { id: req.params.id },
      include: {
        submissions: true,
        exam: { select: { title: true, durationMinutes: true, policyConfig: true } },
      },
    });
    if (!session) {
      res.status(404).json({ success: false, error: 'Session not found' });
      return;
    }
    res.json({ success: true, data: session });
  } catch (err) {
    next(err);
  }
});

// GET /sessions/:id/pairing-qr — generate phone pairing token
sessionRouter.get('/:id/pairing-qr', authenticate, requireRole(UserRole.STUDENT), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id: sessionId } = req.params;
    const session = await prisma.examSession.findUnique({ where: { id: sessionId } });
    if (!session || session.studentId !== req.user!.id) {
      res.status(404).json({ success: false, error: 'Session not found' });
      return;
    }

    const pairingToken = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 1000); // 60s

    const currentDeviceInfo = typeof session.deviceInfo === 'string'
      ? JSON.parse(session.deviceInfo)
      : (session.deviceInfo || {});
    await prisma.examSession.update({
      where: { id: sessionId },
      data: {
        deviceInfo: JSON.stringify({
          ...(currentDeviceInfo as Record<string, unknown>),
          pairingToken,
          pairingTokenExpiresAt: expiresAt.toISOString(),
        }),
      },
    });

    const qrPayload = {
      examSessionId: sessionId,
      pairingToken,
      examServiceUrl: process.env.EXAM_SERVICE_URL || 'http://localhost:4002',
      streamingServiceUrl: process.env.STREAMING_SERVICE_URL || 'http://localhost:4003',
      expiresAt: expiresAt.toISOString(),
    };

    res.json({ success: true, data: qrPayload });
  } catch (err) {
    next(err);
  }
});
