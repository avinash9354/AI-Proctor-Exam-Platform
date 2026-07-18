"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const bcrypt_1 = __importDefault(require("bcrypt"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const shared_1 = require("@exam-platform/shared");
const prisma_1 = require("../lib/prisma");
const jwt_1 = require("../utils/jwt");
const rbac_1 = require("../middleware/rbac");
const logger_1 = require("../utils/logger");
exports.authRouter = (0, express_1.Router)();
// ─── Rate Limiters ────────────────────────────────────────────────────────────
const loginLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 5000, // Increased for demo/dev testing
    message: { success: false, error: 'Too many login attempts, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
});
const signupLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5000, // Increased for demo/dev testing
    message: { success: false, error: 'Too many signup attempts, please try again later' },
});
// ─── POST /auth/signup ────────────────────────────────────────────────────────
exports.authRouter.post('/signup', signupLimiter, async (req, res, next) => {
    try {
        const result = shared_1.SignupSchema.safeParse(req.body);
        if (!result.success) {
            res.status(400).json({ success: false, error: result.error.flatten() });
            return;
        }
        const { name, email, password, role, rollNumber, department, semester } = result.data;
        const existing = await prisma_1.prisma.user.findUnique({ where: { email }, include: { role: true } });
        if (existing) {
            const passwordMatch = await bcrypt_1.default.compare(password, existing.passwordHash);
            if (passwordMatch && existing.isActive) {
                await prisma_1.prisma.user.update({
                    where: { id: existing.id },
                    data: { lastLoginAt: new Date() },
                });
                const tokens = await (0, jwt_1.issueTokenPair)(existing);
                logger_1.logger.info(`User auto-logged in during signup: ${email}`);
                res.status(200).json({
                    success: true,
                    data: {
                        user: {
                            id: existing.id,
                            name: existing.name,
                            email: existing.email,
                            role: existing.role.name,
                            rollNumber: existing.rollNumber,
                            department: existing.department,
                            semester: existing.semester,
                            photoUrl: existing.photoUrl,
                        },
                        ...tokens,
                    },
                });
                return;
            }
            res.status(409).json({ success: false, error: 'Email already registered. Please sign in.' });
            return;
        }
        const dbRole = await prisma_1.prisma.role.findFirst({ where: { name: role } });
        if (!dbRole) {
            res.status(400).json({ success: false, error: 'Invalid role' });
            return;
        }
        const passwordHash = await bcrypt_1.default.hash(password, 12);
        const user = await prisma_1.prisma.user.create({
            data: { name, email, passwordHash, roleId: dbRole.id, rollNumber, department, semester },
            include: { role: true },
        });
        const tokens = await (0, jwt_1.issueTokenPair)(user);
        logger_1.logger.info(`User signed up: ${email} (${role})`);
        res.status(201).json({
            success: true,
            data: {
                user: { id: user.id, name: user.name, email: user.email, role: user.role.name },
                ...tokens,
            },
        });
    }
    catch (err) {
        next(err);
    }
});
// ─── POST /auth/login ─────────────────────────────────────────────────────────
exports.authRouter.post('/login', loginLimiter, async (req, res, next) => {
    try {
        const result = shared_1.LoginSchema.safeParse(req.body);
        if (!result.success) {
            res.status(400).json({ success: false, error: result.error.flatten() });
            return;
        }
        const { email, password } = result.data;
        const user = await prisma_1.prisma.user.findUnique({
            where: { email },
            include: { role: true },
        });
        if (!user || !user.isActive) {
            res.status(401).json({ success: false, error: 'Invalid email or password' });
            return;
        }
        const passwordMatch = await bcrypt_1.default.compare(password, user.passwordHash);
        if (!passwordMatch) {
            res.status(401).json({ success: false, error: 'Invalid email or password' });
            return;
        }
        await prisma_1.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });
        const tokens = await (0, jwt_1.issueTokenPair)(user);
        logger_1.logger.info(`User logged in: ${email}`);
        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role.name,
                    rollNumber: user.rollNumber,
                    department: user.department,
                    semester: user.semester,
                    photoUrl: user.photoUrl,
                },
                ...tokens,
            },
        });
    }
    catch (err) {
        next(err);
    }
});
// ─── POST /auth/refresh ───────────────────────────────────────────────────────
exports.authRouter.post('/refresh', async (req, res, next) => {
    try {
        const result = shared_1.RefreshTokenSchema.safeParse(req.body);
        if (!result.success) {
            res.status(400).json({ success: false, error: 'Missing refresh token' });
            return;
        }
        const { refreshToken } = result.data;
        let payload;
        try {
            payload = (0, jwt_1.verifyRefreshToken)(refreshToken);
        }
        catch {
            res.status(401).json({ success: false, error: 'Invalid or expired refresh token' });
            return;
        }
        const storedToken = await prisma_1.prisma.refreshToken.findFirst({
            where: { token: refreshToken, revokedAt: null },
            include: { user: { include: { role: true } } },
        });
        if (!storedToken || storedToken.expiresAt < new Date()) {
            res.status(401).json({ success: false, error: 'Refresh token expired or revoked' });
            return;
        }
        // Rotate refresh token
        await (0, jwt_1.revokeRefreshToken)(refreshToken);
        const tokens = await (0, jwt_1.issueTokenPair)(storedToken.user);
        res.json({ success: true, data: tokens });
    }
    catch (err) {
        next(err);
    }
});
// ─── POST /auth/logout ────────────────────────────────────────────────────────
exports.authRouter.post('/logout', rbac_1.authenticate, async (req, res, next) => {
    try {
        const token = req.headers.authorization?.slice(7) || '';
        const { refreshToken } = req.body;
        // Blacklist the access token for its remaining TTL
        await (0, jwt_1.blacklistAccessToken)(token, 900);
        if (refreshToken) {
            await (0, jwt_1.revokeRefreshToken)(refreshToken);
        }
        logger_1.logger.info(`User logged out: ${req.user?.email}`);
        res.json({ success: true, message: 'Logged out successfully' });
    }
    catch (err) {
        next(err);
    }
});
// ─── GET /auth/me ─────────────────────────────────────────────────────────────
exports.authRouter.get('/me', rbac_1.authenticate, async (req, res, next) => {
    try {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: req.user.id },
            include: { role: true },
            omit: { passwordHash: true },
        });
        if (!user) {
            res.status(404).json({ success: false, error: 'User not found' });
            return;
        }
        res.json({ success: true, data: { ...user, role: user.role.name } });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=auth.routes.js.map