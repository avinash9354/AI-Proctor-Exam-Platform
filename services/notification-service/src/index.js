"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = exports.io = void 0;
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const redis_adapter_1 = require("@socket.io/redis-adapter");
const ioredis_1 = __importDefault(require("ioredis"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const notify_routes_1 = require("./routes/notify.routes");
const logger_1 = require("./utils/logger");
const app = (0, express_1.default)();
exports.app = app;
const httpServer = (0, http_1.createServer)(app);
const PORT = process.env.PORT || 4004;
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
// ─── Redis Adapter for Socket.IO (with local memory fallback) ────────────────
const pubClient = new ioredis_1.default(REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1 });
const subClient = pubClient.duplicate();
pubClient.on('error', (err) => logger_1.logger.warn('Redis pubClient error (using in-memory fallback):', err.message));
subClient.on('error', (err) => logger_1.logger.warn('Redis subClient error:', err.message));
exports.io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
        credentials: true,
    },
    transports: ['websocket', 'polling'],
});
pubClient.connect().then(() => {
    subClient.connect().then(() => {
        exports.io.adapter((0, redis_adapter_1.createAdapter)(pubClient, subClient));
        logger_1.logger.info('✅ Socket.IO Redis adapter attached');
    });
}).catch(() => {
    logger_1.logger.info('ℹ️ Redis unavailable, Socket.IO running with in-memory adapter');
});
// ─── Socket.IO Connection Handler ─────────────────────────────────────────────
exports.io.on('connection', (socket) => {
    logger_1.logger.info(`Client connected: ${socket.id}`);
    // Admin subscribes to exam room
    socket.on('join:exam', (examId) => {
        socket.join(`exam:${examId}`);
        logger_1.logger.info(`Socket ${socket.id} joined exam room: ${examId}`);
    });
    // Admin subscribes to session room
    socket.on('join:session', (sessionId) => {
        socket.join(`session:${sessionId}`);
    });
    socket.on('disconnect', () => {
        logger_1.logger.info(`Client disconnected: ${socket.id}`);
    });
});
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'notification-service', timestamp: new Date().toISOString() });
});
app.use('/v1/notify', notify_routes_1.notifyRouter);
httpServer.listen(PORT, () => {
    logger_1.logger.info(`🚀 Notification service running on port ${PORT}`);
});
//# sourceMappingURL=index.js.map