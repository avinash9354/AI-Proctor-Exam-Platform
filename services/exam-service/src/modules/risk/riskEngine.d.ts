import { AIEventType, RiskLevel } from '@exam-platform/shared';
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
export declare function calculateRiskLevel(score: number): RiskLevel;
export declare function processAIEvent(event: AIEventInput): Promise<RiskEngineResult>;
//# sourceMappingURL=riskEngine.d.ts.map