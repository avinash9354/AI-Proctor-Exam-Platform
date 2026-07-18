"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
exports.connectRedis = connectRedis;
const ioredis_1 = __importDefault(require("ioredis"));
const logger_1 = require("../utils/logger");
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
exports.redis = new ioredis_1.default(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => Math.min(times * 50, 2000),
    lazyConnect: true,
});
exports.redis.on('connect', () => logger_1.logger.info('✅ Redis connected'));
exports.redis.on('error', (err) => logger_1.logger.error('Redis error:', err.message));
async function connectRedis() {
    try {
        await exports.redis.connect();
    }
    catch {
        logger_1.logger.warn('Redis unavailable, running in local memory fallback mode');
    }
}
//# sourceMappingURL=redis.js.map