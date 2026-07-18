"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signAccessToken = signAccessToken;
exports.signRefreshToken = signRefreshToken;
exports.verifyAccessToken = verifyAccessToken;
exports.verifyRefreshToken = verifyRefreshToken;
exports.issueTokenPair = issueTokenPair;
exports.revokeRefreshToken = revokeRefreshToken;
exports.blacklistAccessToken = blacklistAccessToken;
exports.isTokenBlacklisted = isTokenBlacklisted;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../lib/prisma");
const redis_1 = require("../lib/redis");
const logger_1 = require("./logger");
const ACCESS_SECRET = process.env.JWT_SECRET || 'dev-access-secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret';
const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
const REFRESH_EXPIRES_DAYS = 7;
function signAccessToken(payload) {
    return jsonwebtoken_1.default.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES });
}
function signRefreshToken(userId) {
    return jsonwebtoken_1.default.sign({ sub: userId, type: 'refresh' }, REFRESH_SECRET, {
        expiresIn: REFRESH_EXPIRES,
    });
}
function verifyAccessToken(token) {
    return jsonwebtoken_1.default.verify(token, ACCESS_SECRET);
}
function verifyRefreshToken(token) {
    return jsonwebtoken_1.default.verify(token, REFRESH_SECRET);
}
async function issueTokenPair(user) {
    const payload = {
        sub: user.id,
        email: user.email,
        role: user.role.name,
    };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(user.id);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_EXPIRES_DAYS);
    await prisma_1.prisma.refreshToken.create({
        data: {
            userId: user.id,
            token: refreshToken,
            expiresAt,
        },
    });
    return { accessToken, refreshToken, expiresIn: 900 }; // 15 min in seconds
}
async function revokeRefreshToken(token) {
    await prisma_1.prisma.refreshToken.updateMany({
        where: { token },
        data: { revokedAt: new Date() },
    });
}
async function blacklistAccessToken(token, expiresIn) {
    try {
        await redis_1.redis.set(`blacklist:${token}`, '1', 'EX', expiresIn);
    }
    catch (err) {
        logger_1.logger.warn('Redis unavailable, skipping blacklist set');
    }
}
async function isTokenBlacklisted(token) {
    try {
        const result = await redis_1.redis.get(`blacklist:${token}`);
        return result !== null;
    }
    catch (err) {
        logger_1.logger.warn('Redis unavailable, returning false for blacklist check');
        return false;
    }
}
//# sourceMappingURL=jwt.js.map