import { z } from 'zod';
import { UserRole, ExamType, QuestionType, AIEventType, AIEventSource } from './constants';
export declare const SignupSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    role: z.ZodDefault<z.ZodNativeEnum<typeof UserRole>>;
    rollNumber: z.ZodOptional<z.ZodString>;
    department: z.ZodOptional<z.ZodString>;
    semester: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name: string;
    role: UserRole;
    email: string;
    password: string;
    rollNumber?: string | undefined;
    department?: string | undefined;
    semester?: number | undefined;
}, {
    name: string;
    email: string;
    password: string;
    role?: UserRole | undefined;
    rollNumber?: string | undefined;
    department?: string | undefined;
    semester?: number | undefined;
}>;
export declare const LoginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const RefreshTokenSchema: z.ZodObject<{
    refreshToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    refreshToken: string;
}, {
    refreshToken: string;
}>;
export declare const PolicyConfigSchema: z.ZodObject<{
    requireCamera: z.ZodDefault<z.ZodBoolean>;
    requireMicrophone: z.ZodDefault<z.ZodBoolean>;
    requireScreenShare: z.ZodDefault<z.ZodBoolean>;
    requireMobileProctor: z.ZodDefault<z.ZodBoolean>;
    negativeMarking: z.ZodDefault<z.ZodBoolean>;
    negativeMarkingFraction: z.ZodDefault<z.ZodNumber>;
    shuffleQuestions: z.ZodDefault<z.ZodBoolean>;
    shuffleOptions: z.ZodDefault<z.ZodBoolean>;
    allowedLateJoinMinutes: z.ZodDefault<z.ZodNumber>;
    autoSubmitOnViolations: z.ZodDefault<z.ZodBoolean>;
    maxWarnings: z.ZodDefault<z.ZodNumber>;
    riskWeights: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
    dataRetentionDays: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    requireCamera: boolean;
    requireMicrophone: boolean;
    requireScreenShare: boolean;
    requireMobileProctor: boolean;
    maxWarnings: number;
    dataRetentionDays: number;
    negativeMarking: boolean;
    negativeMarkingFraction: number;
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
    allowedLateJoinMinutes: number;
    autoSubmitOnViolations: boolean;
    riskWeights?: Record<string, number> | undefined;
}, {
    requireCamera?: boolean | undefined;
    requireMicrophone?: boolean | undefined;
    requireScreenShare?: boolean | undefined;
    requireMobileProctor?: boolean | undefined;
    maxWarnings?: number | undefined;
    dataRetentionDays?: number | undefined;
    negativeMarking?: boolean | undefined;
    negativeMarkingFraction?: number | undefined;
    shuffleQuestions?: boolean | undefined;
    shuffleOptions?: boolean | undefined;
    allowedLateJoinMinutes?: number | undefined;
    autoSubmitOnViolations?: boolean | undefined;
    riskWeights?: Record<string, number> | undefined;
}>;
export declare const CreateExamSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    type: z.ZodNativeEnum<typeof ExamType>;
    startTime: z.ZodString;
    endTime: z.ZodString;
    durationMinutes: z.ZodNumber;
    totalMarks: z.ZodNumber;
    passMarks: z.ZodOptional<z.ZodNumber>;
    policyConfig: z.ZodOptional<z.ZodObject<{
        requireCamera: z.ZodDefault<z.ZodBoolean>;
        requireMicrophone: z.ZodDefault<z.ZodBoolean>;
        requireScreenShare: z.ZodDefault<z.ZodBoolean>;
        requireMobileProctor: z.ZodDefault<z.ZodBoolean>;
        negativeMarking: z.ZodDefault<z.ZodBoolean>;
        negativeMarkingFraction: z.ZodDefault<z.ZodNumber>;
        shuffleQuestions: z.ZodDefault<z.ZodBoolean>;
        shuffleOptions: z.ZodDefault<z.ZodBoolean>;
        allowedLateJoinMinutes: z.ZodDefault<z.ZodNumber>;
        autoSubmitOnViolations: z.ZodDefault<z.ZodBoolean>;
        maxWarnings: z.ZodDefault<z.ZodNumber>;
        riskWeights: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
        dataRetentionDays: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        requireCamera: boolean;
        requireMicrophone: boolean;
        requireScreenShare: boolean;
        requireMobileProctor: boolean;
        maxWarnings: number;
        dataRetentionDays: number;
        negativeMarking: boolean;
        negativeMarkingFraction: number;
        shuffleQuestions: boolean;
        shuffleOptions: boolean;
        allowedLateJoinMinutes: number;
        autoSubmitOnViolations: boolean;
        riskWeights?: Record<string, number> | undefined;
    }, {
        requireCamera?: boolean | undefined;
        requireMicrophone?: boolean | undefined;
        requireScreenShare?: boolean | undefined;
        requireMobileProctor?: boolean | undefined;
        maxWarnings?: number | undefined;
        dataRetentionDays?: number | undefined;
        negativeMarking?: boolean | undefined;
        negativeMarkingFraction?: number | undefined;
        shuffleQuestions?: boolean | undefined;
        shuffleOptions?: boolean | undefined;
        allowedLateJoinMinutes?: number | undefined;
        autoSubmitOnViolations?: boolean | undefined;
        riskWeights?: Record<string, number> | undefined;
    }>>;
    sectionTimers: z.ZodOptional<z.ZodArray<z.ZodObject<{
        sectionName: z.ZodString;
        durationMinutes: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        durationMinutes: number;
        sectionName: string;
    }, {
        durationMinutes: number;
        sectionName: string;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    title: string;
    type: ExamType;
    startTime: string;
    endTime: string;
    durationMinutes: number;
    totalMarks: number;
    description?: string | undefined;
    passMarks?: number | undefined;
    policyConfig?: {
        requireCamera: boolean;
        requireMicrophone: boolean;
        requireScreenShare: boolean;
        requireMobileProctor: boolean;
        maxWarnings: number;
        dataRetentionDays: number;
        negativeMarking: boolean;
        negativeMarkingFraction: number;
        shuffleQuestions: boolean;
        shuffleOptions: boolean;
        allowedLateJoinMinutes: number;
        autoSubmitOnViolations: boolean;
        riskWeights?: Record<string, number> | undefined;
    } | undefined;
    sectionTimers?: {
        durationMinutes: number;
        sectionName: string;
    }[] | undefined;
}, {
    title: string;
    type: ExamType;
    startTime: string;
    endTime: string;
    durationMinutes: number;
    totalMarks: number;
    description?: string | undefined;
    passMarks?: number | undefined;
    policyConfig?: {
        requireCamera?: boolean | undefined;
        requireMicrophone?: boolean | undefined;
        requireScreenShare?: boolean | undefined;
        requireMobileProctor?: boolean | undefined;
        maxWarnings?: number | undefined;
        dataRetentionDays?: number | undefined;
        negativeMarking?: boolean | undefined;
        negativeMarkingFraction?: number | undefined;
        shuffleQuestions?: boolean | undefined;
        shuffleOptions?: boolean | undefined;
        allowedLateJoinMinutes?: number | undefined;
        autoSubmitOnViolations?: boolean | undefined;
        riskWeights?: Record<string, number> | undefined;
    } | undefined;
    sectionTimers?: {
        durationMinutes: number;
        sectionName: string;
    }[] | undefined;
}>;
export declare const MCQOptionSchema: z.ZodObject<{
    id: z.ZodString;
    text: z.ZodString;
    isCorrect: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    text: string;
    id: string;
    isCorrect: boolean;
}, {
    text: string;
    id: string;
    isCorrect: boolean;
}>;
export declare const TestCaseSchema: z.ZodObject<{
    input: z.ZodString;
    expectedOutput: z.ZodString;
    isHidden: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    input: string;
    expectedOutput: string;
    isHidden: boolean;
}, {
    input: string;
    expectedOutput: string;
    isHidden?: boolean | undefined;
}>;
export declare const QuestionPayloadSchema: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
    type: z.ZodLiteral<QuestionType.MCQ>;
    text: z.ZodString;
    options: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        text: z.ZodString;
        isCorrect: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        text: string;
        id: string;
        isCorrect: boolean;
    }, {
        text: string;
        id: string;
        isCorrect: boolean;
    }>, "many">;
    explanation: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    text: string;
    type: QuestionType.MCQ;
    options: {
        text: string;
        id: string;
        isCorrect: boolean;
    }[];
    explanation?: string | undefined;
}, {
    text: string;
    type: QuestionType.MCQ;
    options: {
        text: string;
        id: string;
        isCorrect: boolean;
    }[];
    explanation?: string | undefined;
}>, z.ZodObject<{
    type: z.ZodLiteral<QuestionType.MSQ>;
    text: z.ZodString;
    options: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        text: z.ZodString;
        isCorrect: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        text: string;
        id: string;
        isCorrect: boolean;
    }, {
        text: string;
        id: string;
        isCorrect: boolean;
    }>, "many">;
    explanation: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    text: string;
    type: QuestionType.MSQ;
    options: {
        text: string;
        id: string;
        isCorrect: boolean;
    }[];
    explanation?: string | undefined;
}, {
    text: string;
    type: QuestionType.MSQ;
    options: {
        text: string;
        id: string;
        isCorrect: boolean;
    }[];
    explanation?: string | undefined;
}>, z.ZodObject<{
    type: z.ZodLiteral<QuestionType.SUBJECTIVE>;
    text: z.ZodString;
    wordLimit: z.ZodOptional<z.ZodNumber>;
    rubric: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    text: string;
    type: QuestionType.SUBJECTIVE;
    wordLimit?: number | undefined;
    rubric?: string | undefined;
}, {
    text: string;
    type: QuestionType.SUBJECTIVE;
    wordLimit?: number | undefined;
    rubric?: string | undefined;
}>, z.ZodObject<{
    type: z.ZodLiteral<QuestionType.CODING>;
    text: z.ZodString;
    starterCode: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    testCases: z.ZodArray<z.ZodObject<{
        input: z.ZodString;
        expectedOutput: z.ZodString;
        isHidden: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        input: string;
        expectedOutput: string;
        isHidden: boolean;
    }, {
        input: string;
        expectedOutput: string;
        isHidden?: boolean | undefined;
    }>, "many">;
    timeLimit: z.ZodDefault<z.ZodNumber>;
    memoryLimit: z.ZodDefault<z.ZodNumber>;
    allowedLanguages: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    text: string;
    type: QuestionType.CODING;
    allowedLanguages: string[];
    testCases: {
        input: string;
        expectedOutput: string;
        isHidden: boolean;
    }[];
    timeLimit: number;
    memoryLimit: number;
    starterCode?: Record<string, string> | undefined;
}, {
    text: string;
    type: QuestionType.CODING;
    testCases: {
        input: string;
        expectedOutput: string;
        isHidden?: boolean | undefined;
    }[];
    allowedLanguages?: string[] | undefined;
    starterCode?: Record<string, string> | undefined;
    timeLimit?: number | undefined;
    memoryLimit?: number | undefined;
}>, z.ZodObject<{
    type: z.ZodLiteral<QuestionType.TYPING>;
    promptText: z.ZodString;
    durationSeconds: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    type: QuestionType.TYPING;
    promptText: string;
    durationSeconds: number;
}, {
    type: QuestionType.TYPING;
    promptText: string;
    durationSeconds?: number | undefined;
}>]>;
export declare const CreateQuestionSchema: z.ZodObject<{
    examId: z.ZodString;
    type: z.ZodNativeEnum<typeof QuestionType>;
    payload: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
        type: z.ZodLiteral<QuestionType.MCQ>;
        text: z.ZodString;
        options: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            text: z.ZodString;
            isCorrect: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            text: string;
            id: string;
            isCorrect: boolean;
        }, {
            text: string;
            id: string;
            isCorrect: boolean;
        }>, "many">;
        explanation: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        text: string;
        type: QuestionType.MCQ;
        options: {
            text: string;
            id: string;
            isCorrect: boolean;
        }[];
        explanation?: string | undefined;
    }, {
        text: string;
        type: QuestionType.MCQ;
        options: {
            text: string;
            id: string;
            isCorrect: boolean;
        }[];
        explanation?: string | undefined;
    }>, z.ZodObject<{
        type: z.ZodLiteral<QuestionType.MSQ>;
        text: z.ZodString;
        options: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            text: z.ZodString;
            isCorrect: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            text: string;
            id: string;
            isCorrect: boolean;
        }, {
            text: string;
            id: string;
            isCorrect: boolean;
        }>, "many">;
        explanation: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        text: string;
        type: QuestionType.MSQ;
        options: {
            text: string;
            id: string;
            isCorrect: boolean;
        }[];
        explanation?: string | undefined;
    }, {
        text: string;
        type: QuestionType.MSQ;
        options: {
            text: string;
            id: string;
            isCorrect: boolean;
        }[];
        explanation?: string | undefined;
    }>, z.ZodObject<{
        type: z.ZodLiteral<QuestionType.SUBJECTIVE>;
        text: z.ZodString;
        wordLimit: z.ZodOptional<z.ZodNumber>;
        rubric: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        text: string;
        type: QuestionType.SUBJECTIVE;
        wordLimit?: number | undefined;
        rubric?: string | undefined;
    }, {
        text: string;
        type: QuestionType.SUBJECTIVE;
        wordLimit?: number | undefined;
        rubric?: string | undefined;
    }>, z.ZodObject<{
        type: z.ZodLiteral<QuestionType.CODING>;
        text: z.ZodString;
        starterCode: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        testCases: z.ZodArray<z.ZodObject<{
            input: z.ZodString;
            expectedOutput: z.ZodString;
            isHidden: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            input: string;
            expectedOutput: string;
            isHidden: boolean;
        }, {
            input: string;
            expectedOutput: string;
            isHidden?: boolean | undefined;
        }>, "many">;
        timeLimit: z.ZodDefault<z.ZodNumber>;
        memoryLimit: z.ZodDefault<z.ZodNumber>;
        allowedLanguages: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        text: string;
        type: QuestionType.CODING;
        allowedLanguages: string[];
        testCases: {
            input: string;
            expectedOutput: string;
            isHidden: boolean;
        }[];
        timeLimit: number;
        memoryLimit: number;
        starterCode?: Record<string, string> | undefined;
    }, {
        text: string;
        type: QuestionType.CODING;
        testCases: {
            input: string;
            expectedOutput: string;
            isHidden?: boolean | undefined;
        }[];
        allowedLanguages?: string[] | undefined;
        starterCode?: Record<string, string> | undefined;
        timeLimit?: number | undefined;
        memoryLimit?: number | undefined;
    }>, z.ZodObject<{
        type: z.ZodLiteral<QuestionType.TYPING>;
        promptText: z.ZodString;
        durationSeconds: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        type: QuestionType.TYPING;
        promptText: string;
        durationSeconds: number;
    }, {
        type: QuestionType.TYPING;
        promptText: string;
        durationSeconds?: number | undefined;
    }>]>;
    marks: z.ZodNumber;
    negativeMarks: z.ZodDefault<z.ZodNumber>;
    sectionName: z.ZodOptional<z.ZodString>;
    order: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    type: QuestionType;
    marks: number;
    payload: {
        text: string;
        type: QuestionType.MCQ;
        options: {
            text: string;
            id: string;
            isCorrect: boolean;
        }[];
        explanation?: string | undefined;
    } | {
        text: string;
        type: QuestionType.MSQ;
        options: {
            text: string;
            id: string;
            isCorrect: boolean;
        }[];
        explanation?: string | undefined;
    } | {
        text: string;
        type: QuestionType.SUBJECTIVE;
        wordLimit?: number | undefined;
        rubric?: string | undefined;
    } | {
        text: string;
        type: QuestionType.CODING;
        allowedLanguages: string[];
        testCases: {
            input: string;
            expectedOutput: string;
            isHidden: boolean;
        }[];
        timeLimit: number;
        memoryLimit: number;
        starterCode?: Record<string, string> | undefined;
    } | {
        type: QuestionType.TYPING;
        promptText: string;
        durationSeconds: number;
    };
    negativeMarks: number;
    examId: string;
    order?: number | undefined;
    sectionName?: string | undefined;
}, {
    type: QuestionType;
    marks: number;
    payload: {
        text: string;
        type: QuestionType.MCQ;
        options: {
            text: string;
            id: string;
            isCorrect: boolean;
        }[];
        explanation?: string | undefined;
    } | {
        text: string;
        type: QuestionType.MSQ;
        options: {
            text: string;
            id: string;
            isCorrect: boolean;
        }[];
        explanation?: string | undefined;
    } | {
        text: string;
        type: QuestionType.SUBJECTIVE;
        wordLimit?: number | undefined;
        rubric?: string | undefined;
    } | {
        text: string;
        type: QuestionType.CODING;
        testCases: {
            input: string;
            expectedOutput: string;
            isHidden?: boolean | undefined;
        }[];
        allowedLanguages?: string[] | undefined;
        starterCode?: Record<string, string> | undefined;
        timeLimit?: number | undefined;
        memoryLimit?: number | undefined;
    } | {
        type: QuestionType.TYPING;
        promptText: string;
        durationSeconds?: number | undefined;
    };
    examId: string;
    order?: number | undefined;
    negativeMarks?: number | undefined;
    sectionName?: string | undefined;
}>;
export declare const StartSessionSchema: z.ZodObject<{
    examId: z.ZodString;
    consentGiven: z.ZodLiteral<true>;
    deviceInfo: z.ZodOptional<z.ZodObject<{
        userAgent: z.ZodString;
        platform: z.ZodString;
        screenResolution: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        userAgent: string;
        platform: string;
        screenResolution?: string | undefined;
    }, {
        userAgent: string;
        platform: string;
        screenResolution?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    examId: string;
    consentGiven: true;
    deviceInfo?: {
        userAgent: string;
        platform: string;
        screenResolution?: string | undefined;
    } | undefined;
}, {
    examId: string;
    consentGiven: true;
    deviceInfo?: {
        userAgent: string;
        platform: string;
        screenResolution?: string | undefined;
    } | undefined;
}>;
export declare const HeartbeatSchema: z.ZodObject<{
    sessionId: z.ZodString;
    timestamp: z.ZodString;
    connectionQuality: z.ZodOptional<z.ZodEnum<["good", "fair", "poor"]>>;
}, "strip", z.ZodTypeAny, {
    timestamp: string;
    sessionId: string;
    connectionQuality?: "good" | "fair" | "poor" | undefined;
}, {
    timestamp: string;
    sessionId: string;
    connectionQuality?: "good" | "fair" | "poor" | undefined;
}>;
export declare const SubmitAnswerSchema: z.ZodObject<{
    questionId: z.ZodString;
    answer: z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">, z.ZodObject<{
        code: z.ZodString;
        language: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        code: string;
        language: string;
    }, {
        code: string;
        language: string;
    }>]>;
    timeSpentSeconds: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    answer: string | string[] | {
        code: string;
        language: string;
    };
    questionId: string;
    timeSpentSeconds?: number | undefined;
}, {
    answer: string | string[] | {
        code: string;
        language: string;
    };
    questionId: string;
    timeSpentSeconds?: number | undefined;
}>;
export declare const AIEventSchema: z.ZodObject<{
    sessionId: z.ZodString;
    source: z.ZodNativeEnum<typeof AIEventSource>;
    eventType: z.ZodNativeEnum<typeof AIEventType>;
    confidence: z.ZodNumber;
    evidenceRef: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodString;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    source: AIEventSource;
    eventType: AIEventType;
    timestamp: string;
    confidence: number;
    sessionId: string;
    metadata?: Record<string, unknown> | undefined;
    evidenceRef?: string | undefined;
}, {
    source: AIEventSource;
    eventType: AIEventType;
    timestamp: string;
    confidence: number;
    sessionId: string;
    metadata?: Record<string, unknown> | undefined;
    evidenceRef?: string | undefined;
}>;
export declare const UnblockSessionSchema: z.ZodObject<{
    reason: z.ZodString;
    extraTimeMinutes: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    reason: string;
    extraTimeMinutes: number;
}, {
    reason: string;
    extraTimeMinutes?: number | undefined;
}>;
export declare const ForceSubmitSchema: z.ZodObject<{
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    reason: string;
}, {
    reason: string;
}>;
export declare const ExtendTimeSchema: z.ZodObject<{
    extraMinutes: z.ZodNumber;
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    extraMinutes: number;
    reason: string;
}, {
    extraMinutes: number;
    reason: string;
}>;
export declare const ReviewViolationSchema: z.ZodObject<{
    status: z.ZodEnum<["confirmed", "false_positive", "needs_review"]>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "confirmed" | "false_positive" | "needs_review";
    notes?: string | undefined;
}, {
    status: "confirmed" | "false_positive" | "needs_review";
    notes?: string | undefined;
}>;
export declare const PairingQRPayloadSchema: z.ZodObject<{
    examSessionId: z.ZodString;
    pairingToken: z.ZodString;
    examServiceUrl: z.ZodString;
    streamingServiceUrl: z.ZodString;
    expiresAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    examSessionId: string;
    pairingToken: string;
    examServiceUrl: string;
    streamingServiceUrl: string;
    expiresAt: string;
}, {
    examSessionId: string;
    pairingToken: string;
    examServiceUrl: string;
    streamingServiceUrl: string;
    expiresAt: string;
}>;
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
//# sourceMappingURL=schemas.d.ts.map