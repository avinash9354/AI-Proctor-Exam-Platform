"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyAccessToken = verifyAccessToken;
exports.isTokenBlacklisted = isTokenBlacklisted;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const redis_1 = require("../lib/redis");
const logger_1 = require("./logger");
const ACCESS_SECRET = process.env.JWT_SECRET || 'dev-access-secret';
function verifyAccessToken(token) {
    return jsonwebtoken_1.default.verify(token, ACCESS_SECRET);
}
async function isTokenBlacklisted(token) {
    try {
        const result = await redis_1.redis.get(`blacklist:${token}`);
        return result !== null;
    }
    catch {
        logger_1.logger.warn('Redis unavailable, returning false for blacklist check');
        return false;
    }
}
//# sourceMappingURL=jwt.js.map