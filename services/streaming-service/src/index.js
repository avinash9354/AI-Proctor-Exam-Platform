"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const roomManager_1 = require("./sfu/roomManager");
const minio_1 = require("./lib/minio");
const logger_1 = require("./utils/logger");
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const PORT = process.env.PORT || 4003;
exports.io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: process.env.CORS_ORIGINS?.split(',') || ['*'],
        credentials: true,
    },
    transports: ['websocket'],
});
// ─── WebRTC Signaling Namespace ───────────────────────────────────────────────
const signalingNS = exports.io.of('/signaling');
signalingNS.on('connection', (socket) => {
    logger_1.logger.info(`Signaling client connected: ${socket.id}`);
    // Client joins a session room
    socket.on('join', async (data) => {
        const { sessionId, role, streamToken } = data;
        const room = await roomManager_1.roomManager.getOrCreateRoom(sessionId);
        socket.join(`room:${sessionId}`);
        logger_1.logger.info(`Socket ${socket.id} joined room ${sessionId} as ${role}`);
        // Notify existing peers in the room
        socket.to(`room:${sessionId}`).emit('peer:joined', {
            peerId: socket.id,
            role,
        });
        socket.emit('room:joined', {
            roomId: sessionId,
            peers: room.peers.map((p) => ({ peerId: p.id, role: p.role })),
        });
    });
    // WebRTC offer
    socket.on('offer', (data) => {
        socket.to(data.targetPeerId).emit('offer', {
            fromPeerId: socket.id,
            sdp: data.sdp,
        });
    });
    // WebRTC answer
    socket.on('answer', (data) => {
        socket.to(data.targetPeerId).emit('answer', {
            fromPeerId: socket.id,
            sdp: data.sdp,
        });
    });
    // ICE candidate
    socket.on('ice-candidate', (data) => {
        socket.to(data.targetPeerId).emit('ice-candidate', {
            fromPeerId: socket.id,
            candidate: data.candidate,
        });
    });
    // Admin requests high-quality stream for a specific student
    socket.on('request:hq-stream', (data) => {
        socket.to(`room:${data.sessionId}`).emit('stream:quality-change', {
            quality: 'high',
            requestedBy: socket.id,
        });
    });
    socket.on('disconnect', () => {
        logger_1.logger.info(`Signaling client disconnected: ${socket.id}`);
        // Clean up peer from rooms
        roomManager_1.roomManager.removePeer(socket.id);
        socket.broadcast.emit('peer:left', { peerId: socket.id });
    });
});
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'streaming-service', timestamp: new Date().toISOString() });
});
// GET /stream/rooms/:sessionId — room status for monitoring
app.get('/v1/stream/rooms/:sessionId', async (req, res) => {
    const room = await roomManager_1.roomManager.getRoom(req.params.sessionId);
    res.json({ success: true, data: room || { peers: [] } });
});
async function start() {
    await (0, minio_1.ensureBuckets)();
    httpServer.listen(PORT, () => logger_1.logger.info(`🚀 Streaming service running on port ${PORT}`));
}
start().catch((err) => { logger_1.logger.error(err); process.exit(1); });
//# sourceMappingURL=index.js.map