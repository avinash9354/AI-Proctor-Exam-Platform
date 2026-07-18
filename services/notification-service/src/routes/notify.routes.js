"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifyRouter = void 0;
const express_1 = require("express");
const index_1 = require("../index");
const logger_1 = require("../utils/logger");
exports.notifyRouter = (0, express_1.Router)();
// POST /notify/admin — called internally by exam-service when AI events fire
exports.notifyRouter.post('/admin', async (req, res) => {
    try {
        const { type, examId, payload } = req.body;
        if (!type || !payload) {
            res.status(400).json({ success: false, error: 'type and payload required' });
            return;
        }
        const event = {
            type,
            payload,
            timestamp: new Date().toISOString(),
        };
        // Broadcast to all admins watching this exam
        if (examId) {
            index_1.io.to(`exam:${examId}`).emit('admin:notification', event);
        }
        // Also broadcast to session-specific room
        if (payload.sessionId) {
            index_1.io.to(`session:${payload.sessionId}`).emit('session:update', event);
        }
        // High-priority: broadcast globally to all connected admins for red alerts
        if (payload.riskLevel === 'red' || type === 'session_blocked') {
            index_1.io.emit('admin:high_priority', event);
        }
        logger_1.logger.info(`Notification emitted: type=${type} examId=${examId}`);
        res.json({ success: true, data: { emitted: true } });
    }
    catch (err) {
        logger_1.logger.error('Notification error:', err);
        res.status(500).json({ success: false, error: 'Failed to send notification' });
    }
});
// POST /notify/student — send a message to a specific student session
exports.notifyRouter.post('/student', async (req, res) => {
    try {
        const { sessionId, type, message } = req.body;
        index_1.io.to(`session:${sessionId}`).emit('student:notification', { type, message, timestamp: new Date().toISOString() });
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ success: false, error: 'Failed to notify student' });
    }
});
//# sourceMappingURL=notify.routes.js.map