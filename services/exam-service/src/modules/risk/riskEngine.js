"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateRiskLevel = calculateRiskLevel;
exports.processAIEvent = processAIEvent;
const shared_1 = require("@exam-platform/shared");
const prisma_1 = require("../../lib/prisma");
const logger_1 = require("../../utils/logger");
const axios_1 = __importDefault(require("axios"));
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4004';
// ─── Risk Level Calculation ───────────────────────────────────────────────────
function calculateRiskLevel(score) {
    if (score <= shared_1.RISK_THRESHOLDS.GREEN_MAX)
        return shared_1.RiskLevel.GREEN;
    if (score <= shared_1.RISK_THRESHOLDS.YELLOW_MAX)
        return shared_1.RiskLevel.YELLOW;
    if (score <= shared_1.RISK_THRESHOLDS.ORANGE_MAX)
        return shared_1.RiskLevel.ORANGE;
    return shared_1.RiskLevel.RED;
}
// ─── Main Risk Engine ─────────────────────────────────────────────────────────
async function processAIEvent(event) {
    const session = await prisma_1.prisma.examSession.findUnique({
        where: { id: event.sessionId },
        include: {
            exam: true,
            student: { select: { name: true, rollNumber: true } },
        },
    });
    if (!session)
        throw new Error(`Session ${event.sessionId} not found`);
    if (session.status !== shared_1.SessionStatus.IN_PROGRESS) {
        logger_1.logger.warn(`Ignoring AI event for non-active session ${event.sessionId}`);
        return {
            riskScore: session.riskScore,
            riskLevel: calculateRiskLevel(session.riskScore),
            warningIssued: false,
            sessionBlocked: false,
            warningCount: session.warningCount,
        };
    }
    // ─── Get custom weights from policy config ────────────────────────────────
    const policyConfig = session.exam.policyConfig;
    const customWeights = (policyConfig.riskWeights || {});
    const weight = customWeights[event.eventType] ?? shared_1.DEFAULT_RISK_WEIGHTS[event.eventType] ?? 0;
    // ─── Confidence-adjusted delta ────────────────────────────────────────────
    const delta = Math.round(weight * event.confidence);
    const newScore = Math.min(session.riskScore + delta, 150); // cap at 150
    const newLevel = calculateRiskLevel(newScore);
    const prevLevel = calculateRiskLevel(session.riskScore);
    // ─── Store AI event ───────────────────────────────────────────────────────
    await prisma_1.prisma.aIEvent.create({
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
    const maxWarnings = policyConfig.maxWarnings || shared_1.MAX_WARNINGS_BEFORE_BLOCK;
    const autoSubmitOnViolations = policyConfig.autoSubmitOnViolations !== false;
    // Issue warning for medium-high confidence events
    if (event.confidence >= 0.65 && weight >= 8) {
        newWarningCount += 1;
        warningIssued = true;
        await prisma_1.prisma.violation.create({
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
    const updateData = {
        riskScore: newScore,
        riskLevel: newLevel,
        warningCount: newWarningCount,
        updatedAt: new Date(),
    };
    if (sessionBlocked) {
        updateData.status = shared_1.SessionStatus.AUTO_SUBMITTED;
        updateData.isBlocked = true;
        updateData.endedAt = new Date();
    }
    await prisma_1.prisma.examSession.update({
        where: { id: event.sessionId },
        data: updateData,
    });
    // ─── Notify admin if escalation ───────────────────────────────────────────
    const shouldNotify = newLevel === shared_1.RiskLevel.ORANGE || newLevel === shared_1.RiskLevel.RED || sessionBlocked;
    if (shouldNotify || prevLevel !== newLevel) {
        try {
            await axios_1.default.post(`${NOTIFICATION_SERVICE_URL}/v1/notify/admin`, {
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
        }
        catch (err) {
            logger_1.logger.warn('Failed to notify admin (non-critical):', err);
        }
    }
    logger_1.logger.info(`Risk engine: session ${event.sessionId} | ${event.eventType} | score ${session.riskScore} → ${newScore} (${newLevel})${sessionBlocked ? ' [BLOCKED]' : ''}`);
    return {
        riskScore: newScore,
        riskLevel: newLevel,
        warningIssued,
        sessionBlocked,
        warningCount: newWarningCount,
    };
}
//# sourceMappingURL=riskEngine.js.map