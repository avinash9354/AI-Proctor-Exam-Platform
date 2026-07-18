"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRouter = void 0;
const express_1 = require("express");
const rbac_1 = require("../middleware/rbac");
const prisma_1 = require("../lib/prisma");
const shared_1 = require("@exam-platform/shared");
exports.userRouter = (0, express_1.Router)();
// ─── GET /users/profile ───────────────────────────────────────────────────────
exports.userRouter.get('/profile', rbac_1.authenticate, async (req, res, next) => {
    try {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: req.user.id },
            include: { role: true },
            omit: { passwordHash: true },
        });
        res.json({ success: true, data: user });
    }
    catch (err) {
        next(err);
    }
});
// ─── PATCH /users/profile ─────────────────────────────────────────────────────
exports.userRouter.patch('/profile', rbac_1.authenticate, async (req, res, next) => {
    try {
        const { name, department, semester, photoUrl } = req.body;
        const user = await prisma_1.prisma.user.update({
            where: { id: req.user.id },
            data: { name, department, semester, photoUrl, updatedAt: new Date() },
            omit: { passwordHash: true },
        });
        res.json({ success: true, data: user });
    }
    catch (err) {
        next(err);
    }
});
// ─── GET /users (admin only) ──────────────────────────────────────────────────
exports.userRouter.get('/', rbac_1.authenticate, (0, rbac_1.requireRole)(shared_1.UserRole.ADMIN, shared_1.UserRole.SUPER_ADMIN), async (req, res, next) => {
    try {
        const { role, search, page = '1' } = req.query;
        const take = 20;
        const skip = (parseInt(page, 10) - 1) * take;
        const users = await prisma_1.prisma.user.findMany({
            where: {
                ...(role ? { role: { name: role } } : {}),
                ...(search ? {
                    OR: [
                        { name: { contains: search, mode: 'insensitive' } },
                        { email: { contains: search, mode: 'insensitive' } },
                        { rollNumber: { contains: search, mode: 'insensitive' } },
                    ],
                } : {}),
            },
            include: { role: true },
            omit: { passwordHash: true },
            take,
            skip,
            orderBy: { createdAt: 'desc' },
        });
        res.json({ success: true, data: users });
    }
    catch (err) {
        next(err);
    }
});
// ─── POST /users/verify-token (internal service-to-service use) ───────────────
exports.userRouter.post('/verify-token', async (req, res, next) => {
    try {
        const { token } = req.body;
        if (!token) {
            res.status(400).json({ success: false, error: 'Token required' });
            return;
        }
        const { verifyAccessToken } = await Promise.resolve().then(() => __importStar(require('../utils/jwt')));
        const { isTokenBlacklisted } = await Promise.resolve().then(() => __importStar(require('../utils/jwt')));
        const blacklisted = await isTokenBlacklisted(token);
        if (blacklisted) {
            res.status(401).json({ success: false, error: 'Token revoked' });
            return;
        }
        const payload = verifyAccessToken(token);
        res.json({ success: true, data: payload });
    }
    catch {
        res.status(401).json({ success: false, error: 'Invalid token' });
    }
});
//# sourceMappingURL=user.routes.js.map