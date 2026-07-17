// ─── Core Enums ──────────────────────────────────────────────────────────────

export enum UserRole {
  STUDENT = 'student',
  TEACHER = 'teacher',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

export enum ExamType {
  MCQ = 'mcq',
  MSQ = 'msq',
  SUBJECTIVE = 'subjective',
  CODING = 'coding',
  TYPING = 'typing',
}

export enum SessionStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  SUBMITTED = 'submitted',
  AUTO_SUBMITTED = 'auto_submitted',
  BLOCKED = 'blocked',
  TIMED_OUT = 'timed_out',
}

export enum QuestionType {
  MCQ = 'mcq',
  MSQ = 'msq',
  SUBJECTIVE = 'subjective',
  CODING = 'coding',
  TYPING = 'typing',
}

export enum AIEventType {
  MULTIPLE_FACES = 'MULTIPLE_FACES',
  FACE_MISSING = 'FACE_MISSING',
  PHONE_DETECTED = 'PHONE_DETECTED',
  BOOK_DETECTED = 'BOOK_DETECTED',
  NOTES_DETECTED = 'NOTES_DETECTED',
  EARBUDS_DETECTED = 'EARBUDS_DETECTED',
  SECOND_PERSON_DETECTED = 'SECOND_PERSON_DETECTED',
  LOOKING_AWAY = 'LOOKING_AWAY',
  CAMERA_BLOCKED = 'CAMERA_BLOCKED',
  UNAUTHORIZED_APP_TEXT = 'UNAUTHORIZED_APP_TEXT',
  SECOND_VOICE = 'SECOND_VOICE',
  CLIPBOARD_ATTEMPT = 'CLIPBOARD_ATTEMPT',
  FOCUS_LOSS = 'FOCUS_LOSS',
  LONG_INACTIVITY = 'LONG_INACTIVITY',
  UNKNOWN_FACE = 'UNKNOWN_FACE',
}

export enum AIEventSource {
  WEBCAM = 'webcam',
  PHONE_CAM = 'phone_cam',
  SCREEN = 'screen',
  AUDIO = 'audio',
  BROWSER = 'browser',
}

export enum RiskLevel {
  GREEN = 'green',
  YELLOW = 'yellow',
  ORANGE = 'orange',
  RED = 'red',
}

export enum ViolationStatus {
  PENDING_REVIEW = 'pending_review',
  CONFIRMED = 'confirmed',
  FALSE_POSITIVE = 'false_positive',
  NEEDS_REVIEW = 'needs_review',
}

export enum NotificationChannel {
  WEBSOCKET = 'websocket',
  EMAIL = 'email',
  SMS = 'sms',
}

// ─── Risk Score Constants ─────────────────────────────────────────────────────

export const RISK_THRESHOLDS = {
  GREEN_MAX: 20,
  YELLOW_MAX: 45,
  ORANGE_MAX: 75,
} as const;

export const DEFAULT_RISK_WEIGHTS: Record<AIEventType, number> = {
  [AIEventType.MULTIPLE_FACES]: 15,
  [AIEventType.FACE_MISSING]: 10,
  [AIEventType.LOOKING_AWAY]: 5,
  [AIEventType.CAMERA_BLOCKED]: 12,
  [AIEventType.PHONE_DETECTED]: 20,
  [AIEventType.BOOK_DETECTED]: 15,
  [AIEventType.NOTES_DETECTED]: 15,
  [AIEventType.EARBUDS_DETECTED]: 10,
  [AIEventType.SECOND_PERSON_DETECTED]: 20,
  [AIEventType.SECOND_VOICE]: 25,
  [AIEventType.FOCUS_LOSS]: 8,
  [AIEventType.CLIPBOARD_ATTEMPT]: 10,
  [AIEventType.LONG_INACTIVITY]: 5,
  [AIEventType.UNAUTHORIZED_APP_TEXT]: 15,
  [AIEventType.UNKNOWN_FACE]: 20,
};

export const MAX_WARNINGS_BEFORE_BLOCK = 3;
export const HEARTBEAT_INTERVAL_MS = 5000;
export const OFFLINE_GRACE_PERIOD_MS = 120_000; // 2 minutes
export const QR_PAIRING_TOKEN_EXPIRY_SECONDS = 60;

// ─── Pagination ───────────────────────────────────────────────────────────────

export const DEFAULT_PAGE_SIZE = 30;
export const MAX_MONITORING_TILES = 30;

// ─── AI Inference ─────────────────────────────────────────────────────────────

export const AI_FRAME_SAMPLE_INTERVAL_SECONDS = 2;
export const AI_AUDIO_WINDOW_SECONDS = 10;
export const AI_OCR_INTERVAL_SECONDS = 5;
export const AI_MIN_CONFIDENCE = 0.5;
