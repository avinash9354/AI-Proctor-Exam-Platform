import { UserRole, SessionStatus, RiskLevel, AIEventType, AIEventSource, ViolationStatus } from './constants';
export interface JwtPayload {
    sub: string;
    email: string;
    role: UserRole;
    sessionId?: string;
    iat?: number;
    exp?: number;
}
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}
export interface AuthUser {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    rollNumber?: string;
    department?: string;
    semester?: number;
    photoUrl?: string;
}
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
export interface PaginatedResponse<T> {
    items: T[];
    nextCursor?: string;
    total?: number;
    hasMore: boolean;
}
export interface Exam {
    id: string;
    title: string;
    description?: string;
    type: string;
    startTime: string;
    endTime: string;
    durationMinutes: number;
    totalMarks: number;
    passMarks?: number;
    policyConfig: Record<string, unknown>;
    createdBy: string;
    createdAt: string;
}
export interface Question {
    id: string;
    examId: string;
    type: string;
    payload: Record<string, unknown>;
    marks: number;
    negativeMarks: number;
    sectionName?: string;
    order: number;
}
export interface ExamSession {
    id: string;
    examId: string;
    studentId: string;
    status: SessionStatus;
    riskScore: number;
    riskLevel: RiskLevel;
    consentGiven: boolean;
    consentAt?: string;
    startedAt?: string;
    endedAt?: string;
    warningCount: number;
    student?: {
        name: string;
        rollNumber?: string;
        photoUrl?: string;
    };
    exam?: {
        title: string;
        durationMinutes: number;
    };
}
export interface AIEvent {
    id: string;
    sessionId: string;
    source: AIEventSource;
    eventType: AIEventType;
    confidence: number;
    evidenceRef?: string;
    timestamp: string;
    metadata?: Record<string, unknown>;
}
export interface AIEventResponse {
    riskScore: number;
    riskLevel: RiskLevel;
    warningIssued: boolean;
    sessionBlocked: boolean;
}
export interface Violation {
    id: string;
    sessionId: string;
    type: AIEventType;
    warningNumber: number;
    status: ViolationStatus;
    evidenceRef?: string;
    confidence: number;
    reviewedBy?: string;
    reviewNotes?: string;
    createdAt: string;
}
export interface WsSessionUpdate {
    sessionId: string;
    riskScore: number;
    riskLevel: RiskLevel;
    status: SessionStatus;
    warningCount: number;
}
export interface WsAIAlert {
    sessionId: string;
    eventType: AIEventType;
    confidence: number;
    evidenceRef?: string;
    timestamp: string;
    studentName: string;
    rollNumber?: string;
}
export interface WsAdminNotification {
    type: 'session_update' | 'ai_alert' | 'session_blocked' | 'admin_action';
    payload: WsSessionUpdate | WsAIAlert | Record<string, unknown>;
    timestamp: string;
}
export interface MonitoringTile {
    sessionId: string;
    studentId: string;
    studentName: string;
    rollNumber?: string;
    photoUrl?: string;
    riskScore: number;
    riskLevel: RiskLevel;
    status: SessionStatus;
    warningCount: number;
    streamUrl?: string;
    thumbnailUrl?: string;
    lastActivity?: string;
    isPinned: boolean;
}
export interface ExamReport {
    examId: string;
    title: string;
    totalStudents: number;
    completedSessions: number;
    averageScore: number;
    passRate: number;
    averageRiskScore: number;
    violationsByType: Record<string, number>;
    generatedAt: string;
}
export interface AuditLog {
    id: string;
    adminId: string;
    adminName?: string;
    action: string;
    targetSessionId?: string;
    targetStudentId?: string;
    reason: string;
    metadata?: Record<string, unknown>;
    createdAt: string;
}
//# sourceMappingURL=types.d.ts.map