import { SessionStatus } from '@exam-platform/shared';
export declare function transitionSession(sessionId: string, targetStatus: SessionStatus, meta?: {
    adminId?: string;
    reason?: string;
}): Promise<void>;
export declare function checkAndAutoSubmitExpiredSessions(): Promise<void>;
//# sourceMappingURL=examStateMachine.d.ts.map