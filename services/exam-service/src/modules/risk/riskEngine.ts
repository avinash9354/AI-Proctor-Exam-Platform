import {
  AIEventType,
  RiskLevel,
  SessionStatus,
  DEFAULT_RISK_WEIGHTS,
  RISK_THRESHOLDS,
  MAX_WARNINGS_BEFORE_BLOCK,
} from '@exam-platform/shared';
import { prisma } from '../../lib/prisma';
import { logger } from '../../utils/logger';
import axios from 'axios';

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4004';

export interface AIEventInput {
  sessionId: string;
  source: string;
  eventType: AIEventType;
  confidence: number;
  evidenceRef?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface RiskEngineResult {
  riskScore: number;
  riskLevel: RiskLevel;
  warningIssued: boolean;
  sessionBlocked: boolean;
  warningCount: number;
}

// ─── Risk Level Calculation ───────────────────────────────────────────────────
export function calculateRiskLevel(score: number): RiskLevel {
  if (score <= RISK_THRESHOLDS.GREEN_MAX) return RiskLevel.GREEN;
  if (score <= RISK_THRESHOLDS.YELLOW_MAX) return RiskLevel.YELLOW;
  if (score <= RISK_THRESHOLDS.ORANGE_MAX) return RiskLevel.ORANGE;
  return RiskLevel.RED;
}

// ─── Main Risk Engine ─────────────────────────────────────────────────────────
export async function processAIEvent(event: AIEventInput): Promise<RiskEngineResult> {
  const session = await prisma.examSession.findUnique({
    where: { id: event.sessionId },
    include: {
      exam: true,
      student: { select: { name: true, rollNumber: true } },
    },
  });

  if (!session) throw new Error(`Session ${event.sessionId} not found`);
  if (session.status !== SessionStatus.IN_PROGRESS) {
    logger.warn(`Ignoring AI event for non-active session ${event.sessionId}`);
    return {
      riskScore: session.riskScore,
      riskLevel: calculateRiskLevel(session.riskScore),
      warningIssued: false,
      sessionBlocked: false,
      warningCount: session.warningCount,
    };
  }

  // ─── Get custom weights from policy config ────────────────────────────────
  const policyConfig = session.exam.policyConfig as Record<string, unknown>;
  const customWeights = (policyConfig.riskWeights || {}) as Partial<Record<AIEventType, number>>;
  const weight = customWeights[event.eventType] ?? DEFAULT_RISK_WEIGHTS[event.eventType] ?? 0;

  // ─── Confidence-adjusted delta ────────────────────────────────────────────
  const delta = Math.round(weight * event.confidence);
  const newScore = Math.min(session.riskScore + delta, 150); // cap at 150
  const newLevel = calculateRiskLevel(newScore);
  const prevLevel = calculateRiskLevel(session.riskScore);

  // ─── Store AI event ───────────────────────────────────────────────────────
  await prisma.aIEvent.create({
    data: {
      sessionId: event.sessionId,
      source: event.source,
      eventType: event.eventType,
      confidence: event.confidence,
      evidenceRef: event.evidenceRef,
      metadata: event.metadata,
      timestamp: new Date(event.timestamp),
    },
  });

  // ─── Warning logic ────────────────────────────────────────────────────────
  let warningIssued = false;
  let sessionBlocked = false;
  let newWarningCount = session.warningCount;
  const maxWarnings = (policyConfig.maxWarnings as number) || MAX_WARNINGS_BEFORE_BLOCK;
  const autoSubmitOnViolations = policyConfig.autoSubmitOnViolations !== false;

  // Issue warning for medium-high confidence events
  if (event.confidence >= 0.65 && weight >= 8) {
    newWarningCount += 1;
    warningIssued = true;

    await prisma.violation.create({
      data: {
        sessionId: event.sessionId,
        type: event.eventType,
        warningNumber: newWarningCount,
        confidence: event.confidence,
        evidenceRef: event.evidenceRef,
        status: 'pending_review',
      },
    });

    // Check block threshold
    if (autoSubmitOnViolations && newWarningCount > maxWarnings) {
      sessionBlocked = true;
    }
  }

  // ─── Update session ───────────────────────────────────────────────────────
  const updateData: Record<string, unknown> = {
    riskScore: newScore,
    riskLevel: newLevel,
    warningCount: newWarningCount,
    updatedAt: new Date(),
  };

  if (sessionBlocked) {
    updateData.status = SessionStatus.AUTO_SUBMITTED;
    updateData.isBlocked = true;
    updateData.endedAt = new Date();
  }

  await prisma.examSession.update({
    where: { id: event.sessionId },
    data: updateData,
  });

  // ─── Notify admin if escalation ───────────────────────────────────────────
  const shouldNotify = newLevel === RiskLevel.ORANGE || newLevel === RiskLevel.RED || sessionBlocked;
  if (shouldNotify || prevLevel !== newLevel) {
    try {
      await axios.post(`${NOTIFICATION_SERVICE_URL}/v1/notify/admin`, {
        type: sessionBlocked ? 'session_blocked' : 'ai_alert',
        examId: session.examId,
        payload: {
          sessionId: event.sessionId,
          studentName: session.student.name,
          rollNumber: session.student.rollNumber,
          eventType: event.eventType,
          confidence: event.confidence,
          evidenceRef: event.evidenceRef,
          riskScore: newScore,
          riskLevel: newLevel,
          warningCount: newWarningCount,
          sessionBlocked,
          timestamp: event.timestamp,
        },
      }, { timeout: 3000 });
    } catch (err) {
      logger.warn('Failed to notify admin (non-critical):', err);
    }
  }

  logger.info(`Risk engine: session ${event.sessionId} | ${event.eventType} | score ${session.riskScore} → ${newScore} (${newLevel})${sessionBlocked ? ' [BLOCKED]' : ''}`);

  return {
    riskScore: newScore,
    riskLevel: newLevel,
    warningIssued,
    sessionBlocked,
    warningCount: newWarningCount,
  };
}
