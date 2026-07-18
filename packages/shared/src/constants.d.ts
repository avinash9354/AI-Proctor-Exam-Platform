export declare enum UserRole {
    STUDENT = "student",
    TEACHER = "teacher",
    ADMIN = "admin",
    SUPER_ADMIN = "super_admin"
}
export declare enum ExamType {
    MCQ = "mcq",
    MSQ = "msq",
    SUBJECTIVE = "subjective",
    CODING = "coding",
    TYPING = "typing"
}
export declare enum SessionStatus {
    NOT_STARTED = "not_started",
    IN_PROGRESS = "in_progress",
    SUBMITTED = "submitted",
    AUTO_SUBMITTED = "auto_submitted",
    BLOCKED = "blocked",
    TIMED_OUT = "timed_out"
}
export declare enum QuestionType {
    MCQ = "mcq",
    MSQ = "msq",
    SUBJECTIVE = "subjective",
    CODING = "coding",
    TYPING = "typing"
}
export declare enum AIEventType {
    MULTIPLE_FACES = "MULTIPLE_FACES",
    FACE_MISSING = "FACE_MISSING",
    PHONE_DETECTED = "PHONE_DETECTED",
    BOOK_DETECTED = "BOOK_DETECTED",
    NOTES_DETECTED = "NOTES_DETECTED",
    EARBUDS_DETECTED = "EARBUDS_DETECTED",
    SECOND_PERSON_DETECTED = "SECOND_PERSON_DETECTED",
    LOOKING_AWAY = "LOOKING_AWAY",
    CAMERA_BLOCKED = "CAMERA_BLOCKED",
    UNAUTHORIZED_APP_TEXT = "UNAUTHORIZED_APP_TEXT",
    SECOND_VOICE = "SECOND_VOICE",
    CLIPBOARD_ATTEMPT = "CLIPBOARD_ATTEMPT",
    FOCUS_LOSS = "FOCUS_LOSS",
    LONG_INACTIVITY = "LONG_INACTIVITY",
    UNKNOWN_FACE = "UNKNOWN_FACE"
}
export declare enum AIEventSource {
    WEBCAM = "webcam",
    PHONE_CAM = "phone_cam",
    SCREEN = "screen",
    AUDIO = "audio",
    BROWSER = "browser"
}
export declare enum RiskLevel {
    GREEN = "green",
    YELLOW = "yellow",
    ORANGE = "orange",
    RED = "red"
}
export declare enum ViolationStatus {
    PENDING_REVIEW = "pending_review",
    CONFIRMED = "confirmed",
    FALSE_POSITIVE = "false_positive",
    NEEDS_REVIEW = "needs_review"
}
export declare enum NotificationChannel {
    WEBSOCKET = "websocket",
    EMAIL = "email",
    SMS = "sms"
}
export declare const RISK_THRESHOLDS: {
    readonly GREEN_MAX: 20;
    readonly YELLOW_MAX: 45;
    readonly ORANGE_MAX: 75;
};
export declare const DEFAULT_RISK_WEIGHTS: Record<AIEventType, number>;
export declare const MAX_WARNINGS_BEFORE_BLOCK = 3;
export declare const HEARTBEAT_INTERVAL_MS = 5000;
export declare const OFFLINE_GRACE_PERIOD_MS = 120000;
export declare const QR_PAIRING_TOKEN_EXPIRY_SECONDS = 60;
export declare const DEFAULT_PAGE_SIZE = 30;
export declare const MAX_MONITORING_TILES = 30;
export declare const AI_FRAME_SAMPLE_INTERVAL_SECONDS = 2;
export declare const AI_AUDIO_WINDOW_SECONDS = 10;
export declare const AI_OCR_INTERVAL_SECONDS = 5;
export declare const AI_MIN_CONFIDENCE = 0.5;
//# sourceMappingURL=constants.d.ts.map