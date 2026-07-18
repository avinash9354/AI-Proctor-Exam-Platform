"use strict";
// ─── Core Enums ──────────────────────────────────────────────────────────────
Object.defineProperty(exports, "__esModule", { value: true });
exports.AI_MIN_CONFIDENCE = exports.AI_OCR_INTERVAL_SECONDS = exports.AI_AUDIO_WINDOW_SECONDS = exports.AI_FRAME_SAMPLE_INTERVAL_SECONDS = exports.MAX_MONITORING_TILES = exports.DEFAULT_PAGE_SIZE = exports.QR_PAIRING_TOKEN_EXPIRY_SECONDS = exports.OFFLINE_GRACE_PERIOD_MS = exports.HEARTBEAT_INTERVAL_MS = exports.MAX_WARNINGS_BEFORE_BLOCK = exports.DEFAULT_RISK_WEIGHTS = exports.RISK_THRESHOLDS = exports.NotificationChannel = exports.ViolationStatus = exports.RiskLevel = exports.AIEventSource = exports.AIEventType = exports.QuestionType = exports.SessionStatus = exports.ExamType = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["STUDENT"] = "student";
    UserRole["TEACHER"] = "teacher";
    UserRole["ADMIN"] = "admin";
    UserRole["SUPER_ADMIN"] = "super_admin";
})(UserRole || (exports.UserRole = UserRole = {}));
var ExamType;
(function (ExamType) {
    ExamType["MCQ"] = "mcq";
    ExamType["MSQ"] = "msq";
    ExamType["SUBJECTIVE"] = "subjective";
    ExamType["CODING"] = "coding";
    ExamType["TYPING"] = "typing";
})(ExamType || (exports.ExamType = ExamType = {}));
var SessionStatus;
(function (SessionStatus) {
    SessionStatus["NOT_STARTED"] = "not_started";
    SessionStatus["IN_PROGRESS"] = "in_progress";
    SessionStatus["SUBMITTED"] = "submitted";
    SessionStatus["AUTO_SUBMITTED"] = "auto_submitted";
    SessionStatus["BLOCKED"] = "blocked";
    SessionStatus["TIMED_OUT"] = "timed_out";
})(SessionStatus || (exports.SessionStatus = SessionStatus = {}));
var QuestionType;
(function (QuestionType) {
    QuestionType["MCQ"] = "mcq";
    QuestionType["MSQ"] = "msq";
    QuestionType["SUBJECTIVE"] = "subjective";
    QuestionType["CODING"] = "coding";
    QuestionType["TYPING"] = "typing";
})(QuestionType || (exports.QuestionType = QuestionType = {}));
var AIEventType;
(function (AIEventType) {
    AIEventType["MULTIPLE_FACES"] = "MULTIPLE_FACES";
    AIEventType["FACE_MISSING"] = "FACE_MISSING";
    AIEventType["PHONE_DETECTED"] = "PHONE_DETECTED";
    AIEventType["BOOK_DETECTED"] = "BOOK_DETECTED";
    AIEventType["NOTES_DETECTED"] = "NOTES_DETECTED";
    AIEventType["EARBUDS_DETECTED"] = "EARBUDS_DETECTED";
    AIEventType["SECOND_PERSON_DETECTED"] = "SECOND_PERSON_DETECTED";
    AIEventType["LOOKING_AWAY"] = "LOOKING_AWAY";
    AIEventType["CAMERA_BLOCKED"] = "CAMERA_BLOCKED";
    AIEventType["UNAUTHORIZED_APP_TEXT"] = "UNAUTHORIZED_APP_TEXT";
    AIEventType["SECOND_VOICE"] = "SECOND_VOICE";
    AIEventType["CLIPBOARD_ATTEMPT"] = "CLIPBOARD_ATTEMPT";
    AIEventType["FOCUS_LOSS"] = "FOCUS_LOSS";
    AIEventType["LONG_INACTIVITY"] = "LONG_INACTIVITY";
    AIEventType["UNKNOWN_FACE"] = "UNKNOWN_FACE";
})(AIEventType || (exports.AIEventType = AIEventType = {}));
var AIEventSource;
(function (AIEventSource) {
    AIEventSource["WEBCAM"] = "webcam";
    AIEventSource["PHONE_CAM"] = "phone_cam";
    AIEventSource["SCREEN"] = "screen";
    AIEventSource["AUDIO"] = "audio";
    AIEventSource["BROWSER"] = "browser";
})(AIEventSource || (exports.AIEventSource = AIEventSource = {}));
var RiskLevel;
(function (RiskLevel) {
    RiskLevel["GREEN"] = "green";
    RiskLevel["YELLOW"] = "yellow";
    RiskLevel["ORANGE"] = "orange";
    RiskLevel["RED"] = "red";
})(RiskLevel || (exports.RiskLevel = RiskLevel = {}));
var ViolationStatus;
(function (ViolationStatus) {
    ViolationStatus["PENDING_REVIEW"] = "pending_review";
    ViolationStatus["CONFIRMED"] = "confirmed";
    ViolationStatus["FALSE_POSITIVE"] = "false_positive";
    ViolationStatus["NEEDS_REVIEW"] = "needs_review";
})(ViolationStatus || (exports.ViolationStatus = ViolationStatus = {}));
var NotificationChannel;
(function (NotificationChannel) {
    NotificationChannel["WEBSOCKET"] = "websocket";
    NotificationChannel["EMAIL"] = "email";
    NotificationChannel["SMS"] = "sms";
})(NotificationChannel || (exports.NotificationChannel = NotificationChannel = {}));
// ─── Risk Score Constants ─────────────────────────────────────────────────────
exports.RISK_THRESHOLDS = {
    GREEN_MAX: 20,
    YELLOW_MAX: 45,
    ORANGE_MAX: 75,
};
exports.DEFAULT_RISK_WEIGHTS = {
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
exports.MAX_WARNINGS_BEFORE_BLOCK = 3;
exports.HEARTBEAT_INTERVAL_MS = 5000;
exports.OFFLINE_GRACE_PERIOD_MS = 120_000; // 2 minutes
exports.QR_PAIRING_TOKEN_EXPIRY_SECONDS = 60;
// ─── Pagination ───────────────────────────────────────────────────────────────
exports.DEFAULT_PAGE_SIZE = 30;
exports.MAX_MONITORING_TILES = 30;
// ─── AI Inference ─────────────────────────────────────────────────────────────
exports.AI_FRAME_SAMPLE_INTERVAL_SECONDS = 2;
exports.AI_AUDIO_WINDOW_SECONDS = 10;
exports.AI_OCR_INTERVAL_SECONDS = 5;
exports.AI_MIN_CONFIDENCE = 0.5;
//# sourceMappingURL=constants.js.map