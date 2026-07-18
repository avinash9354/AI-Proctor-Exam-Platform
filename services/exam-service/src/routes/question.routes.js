"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.questionRouter = void 0;
const express_1 = require("express");
const shared_1 = require("@exam-platform/shared");
const rbac_1 = require("../middleware/rbac");
const prisma_1 = require("../lib/prisma");
exports.questionRouter = (0, express_1.Router)();
// POST /questions
exports.questionRouter.post('/', rbac_1.authenticate, (0, rbac_1.requireRole)(shared_1.UserRole.ADMIN, shared_1.UserRole.SUPER_ADMIN, shared_1.UserRole.TEACHER), async (req, res, next) => {
    try {
        const result = shared_1.CreateQuestionSchema.safeParse(req.body);
        if (!result.success) {
            res.status(400).json({ success: false, error: result.error.flatten() });
            return;
        }
        const question = await prisma_1.prisma.question.create({ data: result.data });
        res.status(201).json({ success: true, data: question });
    }
    catch (err) {
        next(err);
    }
});
// POST /questions/bulk — batch import
exports.questionRouter.post('/bulk', rbac_1.authenticate, (0, rbac_1.requireRole)(shared_1.UserRole.ADMIN, shared_1.UserRole.SUPER_ADMIN, shared_1.UserRole.TEACHER), async (req, res, next) => {
    try {
        const { questions } = req.body;
        if (!Array.isArray(questions) || questions.length === 0) {
            res.status(400).json({ success: false, error: 'questions array required' });
            return;
        }
        const created = await prisma_1.prisma.question.createMany({ data: questions });
        res.status(201).json({ success: true, data: { count: created.count } });
    }
    catch (err) {
        next(err);
    }
});
// PATCH /questions/:id
exports.questionRouter.patch('/:id', rbac_1.authenticate, (0, rbac_1.requireRole)(shared_1.UserRole.ADMIN, shared_1.UserRole.SUPER_ADMIN, shared_1.UserRole.TEACHER), async (req, res, next) => {
    try {
        const question = await prisma_1.prisma.question.update({
            where: { id: req.params.id },
            data: { ...req.body, updatedAt: new Date() },
        });
        res.json({ success: true, data: question });
    }
    catch (err) {
        next(err);
    }
});
// DELETE /questions/:id
exports.questionRouter.delete('/:id', rbac_1.authenticate, (0, rbac_1.requireRole)(shared_1.UserRole.ADMIN, shared_1.UserRole.SUPER_ADMIN), async (req, res, next) => {
    try {
        await prisma_1.prisma.question.delete({ where: { id: req.params.id } });
        res.json({ success: true, message: 'Question deleted' });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=question.routes.js.map