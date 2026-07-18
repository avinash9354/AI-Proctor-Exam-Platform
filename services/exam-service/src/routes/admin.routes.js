"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRouter = void 0;
const express_1 = require("express");
const shared_1 = require("@exam-platform/shared");
const rbac_1 = require("../middleware/rbac");
const prisma_1 = require("../lib/prisma");
const examStateMachine_1 = require("../modules/exam/examStateMachine");
const shared_2 = require("@exam-platform/shared");
exports.adminRouter = (0, express_1.Router)();
// All admin routes require authentication + admin role
exports.adminRouter.use(rbac_1.authenticate, (0, rbac_1.requireRole)(shared_1.UserRole.ADMIN, shared_1.UserRole.SUPER_ADMIN, shared_1.UserRole.TEACHER));
// GET /admin/sessions — live monitoring grid with cursor pagination
exports.adminRouter.get('/sessions', async (req, res, next) => {
    try {
        const { filter, examId, cursor, limit = String(shared_2.MAX_MONITORING_TILES) } = req.query;
        const take = Math.min(parseInt(limit, 10), shared_2.MAX_MONITORING_TILES);
        const where = {
            status: shared_1.SessionStatus.IN_PROGRESS,
            ...(examId ? { examId } : {}),
            ...(cursor ? { id: { lt: cursor } } : {}),
        };
        // Filters
        if (filter === 'high_risk') {
            where.riskLevel = { in: [shared_1.RiskLevel.ORANGE, shared_1.RiskLevel.RED] };
        }
        else if (filter === 'phone_detected') {
            where.aiEvents = { some: { eventType: 'PHONE_DETECTED' } };
        }
        else if (filter === 'multiple_faces') {
            where.aiEvents = { some: { eventType: 'MULTIPLE_FACES' } };
        }
        else if (filter === 'warnings') {
            where.warningCount = { gte: 1 };
        }
        const sessions = await prisma_1.prisma.examSession.findMany({
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
    }
    catch (err) {
        next(err);
    }
});
// POST /admin/sessions/:id/unblock — admin override
exports.adminRouter.post('/sessions/:id/unblock', async (req, res, next) => {
    try {
        const result = shared_1.UnblockSessionSchema.safeParse(req.body);
        if (!result.success) {
            res.status(400).json({ success: false, error: result.error.flatten() });
            return;
        }
        const { reason, extraTimeMinutes } = result.data;
        const session = await prisma_1.prisma.examSession.findUnique({ where: { id: req.params.id } });
        if (!session) {
            res.status(404).json({ success: false, error: 'Session not found' });
            return;
        }
        await (0, examStateMachine_1.transitionSession)(req.params.id, shared_1.SessionStatus.IN_PROGRESS, {
            adminId: req.user.id,
            reason,
        });
        // Reset block state
        await prisma_1.prisma.examSession.update({
            where: { id: req.params.id },
            data: { isBlocked: false, warningCount: 0 },
        });
        res.json({ success: true, data: { status: 'resumed', extraTimeMinutes } });
    }
    catch (err) {
        next(err);
    }
});
// POST /admin/sessions/:id/force-submit
exports.adminRouter.post('/sessions/:id/force-submit', async (req, res, next) => {
    try {
        const { reason } = req.body;
        if (!reason || reason.length < 10) {
            res.status(400).json({ success: false, error: 'Reason (min 10 chars) is required' });
            return;
        }
        await (0, examStateMachine_1.transitionSession)(req.params.id, shared_1.SessionStatus.AUTO_SUBMITTED, {
            adminId: req.user.id,
            reason,
        });
        res.json({ success: true, data: { status: 'auto_submitted' } });
    }
    catch (err) {
        next(err);
    }
});
// POST /admin/sessions/:id/extend-time
exports.adminRouter.post('/sessions/:id/extend-time', async (req, res, next) => {
    try {
        const { extraMinutes, reason } = req.body;
        if (!extraMinutes || !reason) {
            res.status(400).json({ success: false, error: 'extraMinutes and reason are required' });
            return;
        }
        await prisma_1.prisma.auditLog.create({
            data: {
                adminId: req.user.id,
                action: `extend_time:+${extraMinutes}min`,
                targetSessionId: req.params.id,
                reason,
            },
        });
        res.json({ success: true, data: { extraMinutes, reason } });
    }
    catch (err) {
        next(err);
    }
});
// POST /admin/violations/:id/review — mark violation as confirmed/FP/needs-review
exports.adminRouter.post('/violations/:id/review', async (req, res, next) => {
    try {
        const { status, notes } = req.body;
        if (!['confirmed', 'false_positive', 'needs_review'].includes(status)) {
            res.status(400).json({ success: false, error: 'Invalid status' });
            return;
        }
        const violation = await prisma_1.prisma.violation.update({
            where: { id: req.params.id },
            data: {
                status,
                reviewedBy: req.user.id,
                reviewNotes: notes,
                reviewedAt: new Date(),
            },
        });
        // If false positive, reduce risk score
        if (status === 'false_positive') {
            const session = await prisma_1.prisma.examSession.findUnique({ where: { id: violation.sessionId } });
            if (session) {
                const { DEFAULT_RISK_WEIGHTS } = await Promise.resolve().then(() => __importStar(require('@exam-platform/shared')));
                const { calculateRiskLevel } = await Promise.resolve().then(() => __importStar(require('../modules/risk/riskEngine')));
                const weight = DEFAULT_RISK_WEIGHTS[violation.type] || 0;
                const reduction = Math.round(weight * violation.confidence);
                const newScore = Math.max(0, session.riskScore - reduction);
                await prisma_1.prisma.examSession.update({
                    where: { id: violation.sessionId },
                    data: { riskScore: newScore, riskLevel: calculateRiskLevel(newScore) },
                });
            }
        }
        res.json({ success: true, data: violation });
    }
    catch (err) {
        next(err);
    }
});
// GET /admin/audit-logs
exports.adminRouter.get('/audit-logs', async (req, res, next) => {
    try {
        const { sessionId, page = '1' } = req.query;
        const take = 50;
        const skip = (parseInt(page, 10) - 1) * take;
        const logs = await prisma_1.prisma.auditLog.findMany({
            where: sessionId ? { targetSessionId: sessionId } : {},
            include: { admin: { select: { name: true, email: true } } },
            orderBy: { createdAt: 'desc' },
            take,
            skip,
        });
        res.json({ success: true, data: logs });
    }
    catch (err) {
        next(err);
    }
});
// GET /admin/analytics/exam/:examId
exports.adminRouter.get('/analytics/exam/:examId', async (req, res, next) => {
    try {
        const { examId } = req.params;
        const [sessions, violations] = await Promise.all([
            prisma_1.prisma.examSession.findMany({
                where: { examId },
                include: { submissions: { select: { score: true } } },
            }),
            prisma_1.prisma.violation.findMany({
                where: { session: { examId } },
                select: { type: true, status: true },
            }),
        ]);
        const completedSessions = sessions.filter((s) => ['submitted', 'auto_submitted'].includes(s.status));
        const violationsByType = violations.reduce((acc, v) => {
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
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=admin.routes.js.map