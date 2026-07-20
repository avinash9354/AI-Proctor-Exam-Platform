import { z } from 'zod';
import { UserRole, ExamType, QuestionType, AIEventType, AIEventSource } from './constants';

// ─── Auth Schemas ─────────────────────────────────────────────────────────────

export const SignupSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  role: z.nativeEnum(UserRole).default(UserRole.STUDENT),
  rollNumber: z.string().optional(),
  department: z.string().optional(),
  semester: z.number().int().min(1).max(12).optional(),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export const FirebaseLoginSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  firebaseUid: z.string().min(1),
  photoUrl: z.string().optional(),
  role: z.nativeEnum(UserRole).default(UserRole.STUDENT),
  rollNumber: z.string().optional(),
  department: z.string().optional(),
  semester: z.number().int().min(1).max(12).optional(),
});

// ─── Exam Schemas ─────────────────────────────────────────────────────────────

export const PolicyConfigSchema = z.object({
  requireCamera: z.boolean().default(true),
  requireMicrophone: z.boolean().default(true),
  requireScreenShare: z.boolean().default(true),
  requireMobileProctor: z.boolean().default(false),
  negativeMarking: z.boolean().default(false),
  negativeMarkingFraction: z.number().min(0).max(1).default(0.25),
  shuffleQuestions: z.boolean().default(false),
  shuffleOptions: z.boolean().default(false),
  allowedLateJoinMinutes: z.number().int().default(10),
  autoSubmitOnViolations: z.boolean().default(true),
  maxWarnings: z.number().int().default(3),
  riskWeights: z.record(z.string(), z.number()).optional(),
  dataRetentionDays: z.number().int().default(90),
});

export const CreateExamSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  type: z.nativeEnum(ExamType),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  durationMinutes: z.number().int().min(1),
  totalMarks: z.number().int().min(1),
  passMarks: z.number().int().min(0).optional(),
  policyConfig: PolicyConfigSchema.optional(),
  sectionTimers: z.array(z.object({
    sectionName: z.string(),
    durationMinutes: z.number().int().min(1),
  })).optional(),
});

// ─── Question Schemas ─────────────────────────────────────────────────────────

export const MCQOptionSchema = z.object({
  id: z.string(),
  text: z.string(),
  isCorrect: z.boolean(),
});

export const TestCaseSchema = z.object({
  input: z.string(),
  expectedOutput: z.string(),
  isHidden: z.boolean().default(false),
});

export const QuestionPayloadSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal(QuestionType.MCQ),
    text: z.string(),
    options: z.array(MCQOptionSchema).min(2).max(6),
    explanation: z.string().optional(),
  }),
  z.object({
    type: z.literal(QuestionType.MSQ),
    text: z.string(),
    options: z.array(MCQOptionSchema).min(2).max(8),
    explanation: z.string().optional(),
  }),
  z.object({
    type: z.literal(QuestionType.SUBJECTIVE),
    text: z.string(),
    wordLimit: z.number().int().optional(),
    rubric: z.string().optional(),
  }),
  z.object({
    type: z.literal(QuestionType.CODING),
    text: z.string(),
    starterCode: z.record(z.string(), z.string()).optional(),
    testCases: z.array(TestCaseSchema),
    timeLimit: z.number().int().default(2000),
    memoryLimit: z.number().int().default(256),
    allowedLanguages: z.array(z.string()).default(['javascript', 'python', 'java', 'cpp']),
  }),
  z.object({
    type: z.literal(QuestionType.TYPING),
    promptText: z.string().min(10),
    durationSeconds: z.number().int().default(60),
  }),
]);

export const CreateQuestionSchema = z.object({
  examId: z.string().uuid(),
  type: z.nativeEnum(QuestionType),
  payload: QuestionPayloadSchema,
  marks: z.number().int().min(0),
  negativeMarks: z.number().int().min(0).default(0),
  sectionName: z.string().optional(),
  order: z.number().int().min(0).optional(),
});

// ─── Session Schemas ──────────────────────────────────────────────────────────

export const StartSessionSchema = z.object({
  examId: z.string().uuid(),
  consentGiven: z.literal(true),
  deviceInfo: z.object({
    userAgent: z.string(),
    platform: z.string(),
    screenResolution: z.string().optional(),
  }).optional(),
});

export const HeartbeatSchema = z.object({
  sessionId: z.string().uuid(),
  timestamp: z.string().datetime(),
  connectionQuality: z.enum(['good', 'fair', 'poor']).optional(),
});

export const SubmitAnswerSchema = z.object({
  questionId: z.string().uuid(),
  answer: z.union([
    z.string(),
    z.array(z.string()),
    z.object({ code: z.string(), language: z.string() }),
  ]),
  timeSpentSeconds: z.number().int().min(0).optional(),
});

// ─── AI Event Schema ──────────────────────────────────────────────────────────

export const AIEventSchema = z.object({
  sessionId: z.string().uuid(),
  source: z.nativeEnum(AIEventSource),
  eventType: z.nativeEnum(AIEventType),
  confidence: z.number().min(0).max(1),
  evidenceRef: z.string().optional(),
  timestamp: z.string().datetime(),
  metadata: z.record(z.unknown()).optional(),
});

// ─── Admin Action Schemas ─────────────────────────────────────────────────────

export const UnblockSessionSchema = z.object({
  reason: z.string().min(10).max(500),
  extraTimeMinutes: z.number().int().min(0).default(0),
});

export const ForceSubmitSchema = z.object({
  reason: z.string().min(10).max(500),
});

export const ExtendTimeSchema = z.object({
  extraMinutes: z.number().int().min(1).max(120),
  reason: z.string().min(10).max(500),
});

export const ReviewViolationSchema = z.object({
  status: z.enum(['confirmed', 'false_positive', 'needs_review']),
  notes: z.string().max(1000).optional(),
});

// ─── Pairing Schema ───────────────────────────────────────────────────────────

export const PairingQRPayloadSchema = z.object({
  examSessionId: z.string().uuid(),
  pairingToken: z.string().min(1),
  examServiceUrl: z.string().url(),
  streamingServiceUrl: z.string().url(),
  expiresAt: z.string().datetime(),
});

// ─── Types inferred from schemas ──────────────────────────────────────────────

export type SignupInput = z.infer<typeof SignupSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type CreateExamInput = z.infer<typeof CreateExamSchema>;
export type CreateQuestionInput = z.infer<typeof CreateQuestionSchema>;
export type StartSessionInput = z.infer<typeof StartSessionSchema>;
export type SubmitAnswerInput = z.infer<typeof SubmitAnswerSchema>;
export type AIEventInput = z.infer<typeof AIEventSchema>;
export type UnblockSessionInput = z.infer<typeof UnblockSessionSchema>;
export type PolicyConfig = z.infer<typeof PolicyConfigSchema>;
export type PairingQRPayload = z.infer<typeof PairingQRPayloadSchema>;
