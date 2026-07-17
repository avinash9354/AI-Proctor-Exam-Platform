import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import { roomManager } from './sfu/roomManager';
import { minioClient, ensureBuckets } from './lib/minio';
import { logger } from './utils/logger';

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 4003;

export const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || ['*'],
    credentials: true,
  },
  transports: ['websocket'],
});

// ─── WebRTC Signaling Namespace ───────────────────────────────────────────────
const signalingNS = io.of('/signaling');

signalingNS.on('connection', (socket) => {
  logger.info(`Signaling client connected: ${socket.id}`);

  // Client joins a session room
  socket.on('join', async (data: { sessionId: string; role: 'primary' | 'secondary'; streamToken: string }) => {
    const { sessionId, role, streamToken } = data;

    const room = await roomManager.getOrCreateRoom(sessionId);
    socket.join(`room:${sessionId}`);

    logger.info(`Socket ${socket.id} joined room ${sessionId} as ${role}`);

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
  socket.on('offer', (data: { targetPeerId: string; sdp: RTCSessionDescriptionInit }) => {
    socket.to(data.targetPeerId).emit('offer', {
      fromPeerId: socket.id,
      sdp: data.sdp,
    });
  });

  // WebRTC answer
  socket.on('answer', (data: { targetPeerId: string; sdp: RTCSessionDescriptionInit }) => {
    socket.to(data.targetPeerId).emit('answer', {
      fromPeerId: socket.id,
      sdp: data.sdp,
    });
  });

  // ICE candidate
  socket.on('ice-candidate', (data: { targetPeerId: string; candidate: RTCIceCandidate }) => {
    socket.to(data.targetPeerId).emit('ice-candidate', {
      fromPeerId: socket.id,
      candidate: data.candidate,
    });
  });

  // Admin requests high-quality stream for a specific student
  socket.on('request:hq-stream', (data: { sessionId: string }) => {
    socket.to(`room:${data.sessionId}`).emit('stream:quality-change', {
      quality: 'high',
      requestedBy: socket.id,
    });
  });

  socket.on('disconnect', () => {
    logger.info(`Signaling client disconnected: ${socket.id}`);
    // Clean up peer from rooms
    roomManager.removePeer(socket.id);
    socket.broadcast.emit('peer:left', { peerId: socket.id });
  });
});

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'streaming-service', timestamp: new Date().toISOString() });
});

// GET /stream/rooms/:sessionId — room status for monitoring
app.get('/v1/stream/rooms/:sessionId', async (req, res) => {
  const room = await roomManager.getRoom(req.params.sessionId);
  res.json({ success: true, data: room || { peers: [] } });
});

async function start() {
  await ensureBuckets();
  httpServer.listen(PORT, () => logger.info(`🚀 Streaming service running on port ${PORT}`));
}

start().catch((err) => { logger.error(err); process.exit(1); });
