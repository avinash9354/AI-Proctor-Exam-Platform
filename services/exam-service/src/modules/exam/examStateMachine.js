"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transitionSession = transitionSession;
exports.checkAndAutoSubmitExpiredSessions = checkAndAutoSubmitExpiredSessions;
const shared_1 = require("@exam-platform/shared");
const prisma_1 = require("../../lib/prisma");
const logger_1 = require("../../utils/logger");
/**
 * Exam State Machine
 *
 * Transitions:
 *   not_started → in_progress      (startSession)
 *   in_progress → submitted        (submitSession)
 *   in_progress → auto_submitted   (autoSubmit - violations or timeout)
 *   in_progress → timed_out        (timeout)
 *   in_progress → blocked          (admin block)
 *   blocked     → in_progress      (admin unblock)
 */
const VALID_TRANSITIONS = {
    [shared_1.SessionStatus.NOT_STARTED]: [shared_1.SessionStatus.IN_PROGRESS],
    [shared_1.SessionStatus.IN_PROGRESS]: [
        shared_1.SessionStatus.SUBMITTED,
        shared_1.SessionStatus.AUTO_SUBMITTED,
        shared_1.SessionStatus.TIMED_OUT,
        shared_1.SessionStatus.BLOCKED,
    ],
    [shared_1.SessionStatus.BLOCKED]: [shared_1.SessionStatus.IN_PROGRESS],
};
async function transitionSession(sessionId, targetStatus, meta) {
    const session = await prisma_1.prisma.examSession.findUnique({
        where: { id: sessionId },
        select: { status: true },
    });
    if (!session)
        throw new Error(`Session ${sessionId} not found`);
    const allowed = VALID_TRANSITIONS[session.status] || [];
    if (!allowed.includes(targetStatus)) {
        throw new Error(`Invalid transition: ${session.status} → ${targetStatus}`);
    }
    const updateData = {
        status: targetStatus,
        updatedAt: new Date(),
    };
    if (targetStatus === shared_1.SessionStatus.IN_PROGRESS && session.status === shared_1.SessionStatus.NOT_STARTED) {
        updateData.startedAt = new Date();
    }
    if ([shared_1.SessionStatus.SUBMITTED, shared_1.SessionStatus.AUTO_SUBMITTED, shared_1.SessionStatus.TIMED_OUT].includes(targetStatus)) {
        updateData.endedAt = new Date();
    }
    await prisma_1.prisma.examSession.update({ where: { id: sessionId }, data: updateData });
    // Audit log for admin actions
    if (meta?.adminId) {
        await prisma_1.prisma.auditLog.create({
            data: {
                adminId: meta.adminId,
                action: `session_status_change:${session.status}→${targetStatus}`,
                targetSessionId: sessionId,
                reason: meta.reason || 'No reason provided',
            },
        });
    }
    logger_1.logger.info(`Session ${sessionId}: ${session.status} → ${targetStatus}`);
}
async function checkAndAutoSubmitExpiredSessions() {
    const now = new Date();
    const expiredSessions = await prisma_1.prisma.examSession.findMany({
        where: {
            status: shared_1.SessionStatus.IN_PROGRESS,
            exam: {
                endTime: { lte: now },
            },
        },
        include: { exam: { select: { endTime: true, durationMinutes: true } } },
    });
    for (const session of expiredSessions) {
        // Check if duration has elapsed from start
        if (session.startedAt) {
            const durationMs = session.exam.durationMinutes * 60 * 1000;
            const elapsed = now.getTime() - session.startedAt.getTime();
            if (elapsed >= durationMs) {
                await transitionSession(session.id, shared_1.SessionStatus.TIMED_OUT);
            }
        }
    }
}
//# sourceMappingURL=examStateMachine.js.map