"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PairingQRPayloadSchema = exports.ReviewViolationSchema = exports.ExtendTimeSchema = exports.ForceSubmitSchema = exports.UnblockSessionSchema = exports.AIEventSchema = exports.SubmitAnswerSchema = exports.HeartbeatSchema = exports.StartSessionSchema = exports.CreateQuestionSchema = exports.QuestionPayloadSchema = exports.TestCaseSchema = exports.MCQOptionSchema = exports.CreateExamSchema = exports.PolicyConfigSchema = exports.RefreshTokenSchema = exports.LoginSchema = exports.SignupSchema = void 0;
const zod_1 = require("zod");
const constants_1 = require("./constants");
// ─── Auth Schemas ─────────────────────────────────────────────────────────────
exports.SignupSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(100),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8).max(128),
    role: zod_1.z.nativeEnum(constants_1.UserRole).default(constants_1.UserRole.STUDENT),
    rollNumber: zod_1.z.string().optional(),
    department: zod_1.z.string().optional(),
    semester: zod_1.z.number().int().min(1).max(12).optional(),
});
exports.LoginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
});
exports.RefreshTokenSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1),
});
// ─── Exam Schemas ─────────────────────────────────────────────────────────────
exports.PolicyConfigSchema = zod_1.z.object({
    requireCamera: zod_1.z.boolean().default(true),
    requireMicrophone: zod_1.z.boolean().default(true),
    requireScreenShare: zod_1.z.boolean().default(true),
    requireMobileProctor: zod_1.z.boolean().default(false),
    negativeMarking: zod_1.z.boolean().default(false),
    negativeMarkingFraction: zod_1.z.number().min(0).max(1).default(0.25),
    shuffleQuestions: zod_1.z.boolean().default(false),
    shuffleOptions: zod_1.z.boolean().default(false),
    allowedLateJoinMinutes: zod_1.z.number().int().default(10),
    autoSubmitOnViolations: zod_1.z.boolean().default(true),
    maxWarnings: zod_1.z.number().int().default(3),
    riskWeights: zod_1.z.record(zod_1.z.string(), zod_1.z.number()).optional(),
    dataRetentionDays: zod_1.z.number().int().default(90),
});
exports.CreateExamSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(200),
    description: zod_1.z.string().optional(),
    type: zod_1.z.nativeEnum(constants_1.ExamType),
    startTime: zod_1.z.string().datetime(),
    endTime: zod_1.z.string().datetime(),
    durationMinutes: zod_1.z.number().int().min(1),
    totalMarks: zod_1.z.number().int().min(1),
    passMarks: zod_1.z.number().int().min(0).optional(),
    policyConfig: exports.PolicyConfigSchema.optional(),
    sectionTimers: zod_1.z.array(zod_1.z.object({
        sectionName: zod_1.z.string(),
        durationMinutes: zod_1.z.number().int().min(1),
    })).optional(),
});
// ─── Question Schemas ─────────────────────────────────────────────────────────
exports.MCQOptionSchema = zod_1.z.object({
    id: zod_1.z.string(),
    text: zod_1.z.string(),
    isCorrect: zod_1.z.boolean(),
});
exports.TestCaseSchema = zod_1.z.object({
    input: zod_1.z.string(),
    expectedOutput: zod_1.z.string(),
    isHidden: zod_1.z.boolean().default(false),
});
exports.QuestionPayloadSchema = zod_1.z.discriminatedUnion('type', [
    zod_1.z.object({
        type: zod_1.z.literal(constants_1.QuestionType.MCQ),
        text: zod_1.z.string(),
        options: zod_1.z.array(exports.MCQOptionSchema).min(2).max(6),
        explanation: zod_1.z.string().optional(),
    }),
    zod_1.z.object({
        type: zod_1.z.literal(constants_1.QuestionType.MSQ),
        text: zod_1.z.string(),
        options: zod_1.z.array(exports.MCQOptionSchema).min(2).max(8),
        explanation: zod_1.z.string().optional(),
    }),
    zod_1.z.object({
        type: zod_1.z.literal(constants_1.QuestionType.SUBJECTIVE),
        text: zod_1.z.string(),
        wordLimit: zod_1.z.number().int().optional(),
        rubric: zod_1.z.string().optional(),
    }),
    zod_1.z.object({
        type: zod_1.z.literal(constants_1.QuestionType.CODING),
        text: zod_1.z.string(),
        starterCode: zod_1.z.record(zod_1.z.string(), zod_1.z.string()).optional(),
        testCases: zod_1.z.array(exports.TestCaseSchema),
        timeLimit: zod_1.z.number().int().default(2000),
        memoryLimit: zod_1.z.number().int().default(256),
        allowedLanguages: zod_1.z.array(zod_1.z.string()).default(['javascript', 'python', 'java', 'cpp']),
    }),
    zod_1.z.object({
        type: zod_1.z.literal(constants_1.QuestionType.TYPING),
        promptText: zod_1.z.string().min(10),
        durationSeconds: zod_1.z.number().int().default(60),
    }),
]);
exports.CreateQuestionSchema = zod_1.z.object({
    examId: zod_1.z.string().uuid(),
    type: zod_1.z.nativeEnum(constants_1.QuestionType),
    payload: exports.QuestionPayloadSchema,
    marks: zod_1.z.number().int().min(0),
    negativeMarks: zod_1.z.number().int().min(0).default(0),
    sectionName: zod_1.z.string().optional(),
    order: zod_1.z.number().int().min(0).optional(),
});
// ─── Session Schemas ──────────────────────────────────────────────────────────
exports.StartSessionSchema = zod_1.z.object({
    examId: zod_1.z.string().uuid(),
    consentGiven: zod_1.z.literal(true),
    deviceInfo: zod_1.z.object({
        userAgent: zod_1.z.string(),
        platform: zod_1.z.string(),
        screenResolution: zod_1.z.string().optional(),
    }).optional(),
});
exports.HeartbeatSchema = zod_1.z.object({
    sessionId: zod_1.z.string().uuid(),
    timestamp: zod_1.z.string().datetime(),
    connectionQuality: zod_1.z.enum(['good', 'fair', 'poor']).optional(),
});
exports.SubmitAnswerSchema = zod_1.z.object({
    questionId: zod_1.z.string().uuid(),
    answer: zod_1.z.union([
        zod_1.z.string(),
        zod_1.z.array(zod_1.z.string()),
        zod_1.z.object({ code: zod_1.z.string(), language: zod_1.z.string() }),
    ]),
    timeSpentSeconds: zod_1.z.number().int().min(0).optional(),
});
// ─── AI Event Schema ──────────────────────────────────────────────────────────
exports.AIEventSchema = zod_1.z.object({
    sessionId: zod_1.z.string().uuid(),
    source: zod_1.z.nativeEnum(constants_1.AIEventSource),
    eventType: zod_1.z.nativeEnum(constants_1.AIEventType),
    confidence: zod_1.z.number().min(0).max(1),
    evidenceRef: zod_1.z.string().optional(),
    timestamp: zod_1.z.string().datetime(),
    metadata: zod_1.z.record(zod_1.z.unknown()).optional(),
});
// ─── Admin Action Schemas ─────────────────────────────────────────────────────
exports.UnblockSessionSchema = zod_1.z.object({
    reason: zod_1.z.string().min(10).max(500),
    extraTimeMinutes: zod_1.z.number().int().min(0).default(0),
});
exports.ForceSubmitSchema = zod_1.z.object({
    reason: zod_1.z.string().min(10).max(500),
});
exports.ExtendTimeSchema = zod_1.z.object({
    extraMinutes: zod_1.z.number().int().min(1).max(120),
    reason: zod_1.z.string().min(10).max(500),
});
exports.ReviewViolationSchema = zod_1.z.object({
    status: zod_1.z.enum(['confirmed', 'false_positive', 'needs_review']),
    notes: zod_1.z.string().max(1000).optional(),
});
// ─── Pairing Schema ───────────────────────────────────────────────────────────
exports.PairingQRPayloadSchema = zod_1.z.object({
    examSessionId: zod_1.z.string().uuid(),
    pairingToken: zod_1.z.string().min(1),
    examServiceUrl: zod_1.z.string().url(),
    streamingServiceUrl: zod_1.z.string().url(),
    expiresAt: zod_1.z.string().datetime(),
});
//# sourceMappingURL=schemas.js.map