"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionRouter = void 0;
const express_1 = require("express");
const shared_1 = require("@exam-platform/shared");
const shared_2 = require("@exam-platform/shared");
const rbac_1 = require("../middleware/rbac");
const prisma_1 = require("../lib/prisma");
const examStateMachine_1 = require("../modules/exam/examStateMachine");
const uuid_1 = require("uuid");
exports.sessionRouter = (0, express_1.Router)();
// POST /sessions/start
exports.sessionRouter.post('/start', rbac_1.authenticate, (0, rbac_1.requireRole)(shared_2.UserRole.STUDENT), async (req, res, next) => {
    try {
        const result = shared_1.StartSessionSchema.safeParse(req.body);
        if (!result.success) {
            res.status(400).json({ success: false, error: result.error.flatten() });
            return;
        }
        const { examId, consentGiven, deviceInfo } = result.data;
        // Verify exam exists and is active
        const exam = await prisma_1.prisma.exam.findUnique({ where: { id: examId } });
        if (!exam) {
            res.status(404).json({ success: false, error: 'Exam not found' });
            return;
        }
        const now = new Date();
        const lateJoinWindow = (exam.policyConfig.allowedLateJoinMinutes || 10) * 60 * 1000;
        if (now < exam.startTime || now > new Date(exam.endTime.getTime() + lateJoinWindow)) {
            res.status(400).json({ success: false, error: 'Exam is not currently active' });
            return;
        }
        // Check enrollment
        const enrollment = await prisma_1.prisma.enrollment.findUnique({
            where: { examId_studentId: { examId, studentId: req.user.id } },
        });
        if (!enrollment) {
            res.status(403).json({ success: false, error: 'Not enrolled in this exam' });
            return;
        }
        // Upsert session (idempotent — student may reconnect)
        let session = await prisma_1.prisma.examSession.findUnique({
            where: { examId_studentId: { examId, studentId: req.user.id } },
        });
        if (!session) {
            session = await prisma_1.prisma.examSession.create({
                data: {
                    examId,
                    studentId: req.user.id,
                    status: shared_2.SessionStatus.NOT_STARTED,
                    consentGiven,
                    consentAt: consentGiven ? new Date() : undefined,
                    consentIp: req.ip,
                    deviceInfo: deviceInfo ? (typeof deviceInfo === 'string' ? deviceInfo : JSON.stringify(deviceInfo)) : undefined,
                    streamToken: (0, uuid_1.v4)(),
                },
            });
        }
        if (session.status === shared_2.SessionStatus.NOT_STARTED) {
            await (0, examStateMachine_1.transitionSession)(session.id, shared_2.SessionStatus.IN_PROGRESS);
        }
        // Return session info + websocket token
        res.json({
            success: true,
            data: {
                sessionId: session.id,
                status: shared_2.SessionStatus.IN_PROGRESS,
                streamToken: session.streamToken,
                riskScore: session.riskScore,
                examDurationMinutes: exam.durationMinutes,
                startedAt: session.startedAt || new Date(),
            },
        });
    }
    catch (err) {
        next(err);
    }
});
// POST /sessions/:id/heartbeat
exports.sessionRouter.post('/:id/heartbeat', rbac_1.authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;
        await prisma_1.prisma.examSession.update({
            where: { id },
            data: { updatedAt: new Date() },
        });
        res.json({ success: true, data: { ack: true, timestamp: new Date().toISOString() } });
    }
    catch (err) {
        next(err);
    }
});
// POST /sessions/:id/submit
exports.sessionRouter.post('/:id/submit', rbac_1.authenticate, (0, rbac_1.requireRole)(shared_2.UserRole.STUDENT), async (req, res, next) => {
    try {
        const { id } = req.params;
        const session = await prisma_1.prisma.examSession.findUnique({ where: { id } });
        if (!session || session.studentId !== req.user.id) {
            res.status(404).json({ success: false, error: 'Session not found' });
            return;
        }
        await (0, examStateMachine_1.transitionSession)(id, shared_2.SessionStatus.SUBMITTED);
        res.json({ success: true, data: { status: 'submitted', endedAt: new Date() } });
    }
    catch (err) {
        next(err);
    }
});
// POST /sessions/:id/answer — save/update a single answer (autosave)
exports.sessionRouter.post('/:id/answer', rbac_1.authenticate, (0, rbac_1.requireRole)(shared_2.UserRole.STUDENT), async (req, res, next) => {
    try {
        const { id: sessionId } = req.params;
        const result = shared_1.SubmitAnswerSchema.safeParse(req.body);
        if (!result.success) {
            res.status(400).json({ success: false, error: result.error.flatten() });
            return;
        }
        const { questionId, answer, timeSpentSeconds } = result.data;
        const submission = await prisma_1.prisma.submission.upsert({
            where: { sessionId_questionId: { sessionId, questionId } },
            update: { answer, timeSpentSeconds, updatedAt: new Date() },
            create: { sessionId, questionId, answer, timeSpentSeconds },
        });
        res.json({ success: true, data: { id: submission.id, savedAt: new Date() } });
    }
    catch (err) {
        next(err);
    }
});
// GET /sessions/:id — get session + submissions for student
exports.sessionRouter.get('/:id', rbac_1.authenticate, async (req, res, next) => {
    try {
        const session = await prisma_1.prisma.examSession.findUnique({
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
    }
    catch (err) {
        next(err);
    }
});
// GET /sessions/:id/pairing-qr — generate phone pairing token
exports.sessionRouter.get('/:id/pairing-qr', rbac_1.authenticate, (0, rbac_1.requireRole)(shared_2.UserRole.STUDENT), async (req, res, next) => {
    try {
        const { id: sessionId } = req.params;
        const session = await prisma_1.prisma.examSession.findUnique({ where: { id: sessionId } });
        if (!session || session.studentId !== req.user.id) {
            res.status(404).json({ success: false, error: 'Session not found' });
            return;
        }
        const pairingToken = (0, uuid_1.v4)();
        const expiresAt = new Date(Date.now() + 60 * 1000); // 60s
        // Store pairing token in session metadata
        await prisma_1.prisma.examSession.update({
            where: { id: sessionId },
            data: { deviceInfo: { ...(session.deviceInfo || {}), pairingToken, pairingTokenExpiresAt: expiresAt.toISOString() } },
        });
        const qrPayload = {
            examSessionId: sessionId,
            pairingToken,
            examServiceUrl: process.env.EXAM_SERVICE_URL || 'http://localhost:4002',
            streamingServiceUrl: process.env.STREAMING_SERVICE_URL || 'http://localhost:4003',
            expiresAt: expiresAt.toISOString(),
        };
        res.json({ success: true, data: qrPayload });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=session.routes.js.map