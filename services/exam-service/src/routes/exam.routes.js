"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.examRouter = void 0;
const express_1 = require("express");
const shared_1 = require("@exam-platform/shared");
const rbac_1 = require("../middleware/rbac");
const shared_2 = require("@exam-platform/shared");
const prisma_1 = require("../lib/prisma");
exports.examRouter = (0, express_1.Router)();
// GET /exams?status=upcoming|completed|all
exports.examRouter.get('/', rbac_1.authenticate, async (req, res, next) => {
    try {
        const { status = 'all' } = req.query;
        const now = new Date();
        const where = { isPublished: true };
        if (status === 'upcoming')
            where.startTime = { gte: now };
        if (status === 'live') {
            where.startTime = { lte: now };
            where.endTime = { gte: now };
        }
        if (status === 'completed')
            where.endTime = { lte: now };
        // Students only see exams they're enrolled in
        if (req.user?.role === shared_2.UserRole.STUDENT) {
            where.enrollments = { some: { studentId: req.user.id } };
        }
        const exams = await prisma_1.prisma.exam.findMany({
            where,
            include: {
                _count: { select: { questions: true, sessions: true } },
            },
            orderBy: { startTime: 'asc' },
        });
        res.json({ success: true, data: exams });
    }
    catch (err) {
        next(err);
    }
});
// GET /exams/:id
exports.examRouter.get('/:id', rbac_1.authenticate, async (req, res, next) => {
    try {
        const exam = await prisma_1.prisma.exam.findUnique({
            where: { id: req.params.id },
            include: {
                _count: { select: { questions: true } },
            },
        });
        if (!exam) {
            res.status(404).json({ success: false, error: 'Exam not found' });
            return;
        }
        res.json({ success: true, data: exam });
    }
    catch (err) {
        next(err);
    }
});
// POST /exams — admin/teacher only
exports.examRouter.post('/', rbac_1.authenticate, (0, rbac_1.requireRole)(shared_2.UserRole.ADMIN, shared_2.UserRole.SUPER_ADMIN, shared_2.UserRole.TEACHER), async (req, res, next) => {
    try {
        const result = shared_1.CreateExamSchema.safeParse(req.body);
        if (!result.success) {
            res.status(400).json({ success: false, error: result.error.flatten() });
            return;
        }
        const exam = await prisma_1.prisma.exam.create({
            data: {
                ...result.data,
                startTime: new Date(result.data.startTime),
                endTime: new Date(result.data.endTime),
                createdBy: req.user.id,
                policyConfig: result.data.policyConfig || {},
            },
        });
        res.status(201).json({ success: true, data: exam });
    }
    catch (err) {
        next(err);
    }
});
// PATCH /exams/:id
exports.examRouter.patch('/:id', rbac_1.authenticate, (0, rbac_1.requireRole)(shared_2.UserRole.ADMIN, shared_2.UserRole.SUPER_ADMIN, shared_2.UserRole.TEACHER), async (req, res, next) => {
    try {
        const exam = await prisma_1.prisma.exam.update({
            where: { id: req.params.id },
            data: { ...req.body, updatedAt: new Date() },
        });
        res.json({ success: true, data: exam });
    }
    catch (err) {
        next(err);
    }
});
// DELETE /exams/:id
exports.examRouter.delete('/:id', rbac_1.authenticate, (0, rbac_1.requireRole)(shared_2.UserRole.ADMIN, shared_2.UserRole.SUPER_ADMIN), async (req, res, next) => {
    try {
        await prisma_1.prisma.exam.delete({ where: { id: req.params.id } });
        res.json({ success: true, message: 'Exam deleted' });
    }
    catch (err) {
        next(err);
    }
});
// GET /exams/:id/questions — returns questions for the exam
exports.examRouter.get('/:id/questions', rbac_1.authenticate, async (req, res, next) => {
    try {
        const isStudent = req.user?.role === shared_2.UserRole.STUDENT;
        const questions = await prisma_1.prisma.question.findMany({
            where: { examId: req.params.id },
            orderBy: { order: 'asc' },
        });
        // Strip correct answers for students
        const sanitized = isStudent
            ? questions.map((q) => ({
                ...q,
                payload: sanitizeQuestionForStudent(q.payload),
            }))
            : questions;
        res.json({ success: true, data: sanitized });
    }
    catch (err) {
        next(err);
    }
});
function sanitizeQuestionForStudent(payload) {
    if (payload.type === 'mcq' || payload.type === 'msq') {
        const options = payload.options?.map(({ isCorrect: _, ...opt }) => opt);
        const { explanation: _exp, ...rest } = payload;
        return { ...rest, options };
    }
    if (payload.type === 'coding') {
        const testCases = payload.testCases?.filter((tc) => !tc.isHidden);
        return { ...payload, testCases };
    }
    return payload;
}
//# sourceMappingURL=exam.routes.js.map