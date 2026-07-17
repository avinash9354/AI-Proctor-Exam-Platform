import { SessionStatus } from '@exam-platform/shared';
import { prisma } from '../../lib/prisma';
import { logger } from '../../utils/logger';

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

const VALID_TRANSITIONS: Record<string, string[]> = {
  [SessionStatus.NOT_STARTED]: [SessionStatus.IN_PROGRESS],
  [SessionStatus.IN_PROGRESS]: [
    SessionStatus.SUBMITTED,
    SessionStatus.AUTO_SUBMITTED,
    SessionStatus.TIMED_OUT,
    SessionStatus.BLOCKED,
  ],
  [SessionStatus.BLOCKED]: [SessionStatus.IN_PROGRESS],
};

export async function transitionSession(
  sessionId: string,
  targetStatus: SessionStatus,
  meta?: { adminId?: string; reason?: string }
): Promise<void> {
  const session = await prisma.examSession.findUnique({
    where: { id: sessionId },
    select: { status: true },
  });

  if (!session) throw new Error(`Session ${sessionId} not found`);

  const allowed = VALID_TRANSITIONS[session.status] || [];
  if (!allowed.includes(targetStatus)) {
    throw new Error(`Invalid transition: ${session.status} → ${targetStatus}`);
  }

  const updateData: Record<string, unknown> = {
    status: targetStatus,
    updatedAt: new Date(),
  };

  if (targetStatus === SessionStatus.IN_PROGRESS && session.status === SessionStatus.NOT_STARTED) {
    updateData.startedAt = new Date();
  }

  if ([SessionStatus.SUBMITTED, SessionStatus.AUTO_SUBMITTED, SessionStatus.TIMED_OUT].includes(targetStatus)) {
    updateData.endedAt = new Date();
  }

  await prisma.examSession.update({ where: { id: sessionId }, data: updateData });

  // Audit log for admin actions
  if (meta?.adminId) {
    await prisma.auditLog.create({
      data: {
        adminId: meta.adminId,
        action: `session_status_change:${session.status}→${targetStatus}`,
        targetSessionId: sessionId,
        reason: meta.reason || 'No reason provided',
      },
    });
  }

  logger.info(`Session ${sessionId}: ${session.status} → ${targetStatus}`);
}

export async function checkAndAutoSubmitExpiredSessions(): Promise<void> {
  const now = new Date();

  const expiredSessions = await prisma.examSession.findMany({
    where: {
      status: SessionStatus.IN_PROGRESS,
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
        await transitionSession(session.id, SessionStatus.TIMED_OUT);
      }
    }
  }
}
