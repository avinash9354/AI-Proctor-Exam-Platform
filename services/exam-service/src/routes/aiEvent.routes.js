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
exports.aiEventRouter = void 0;
const express_1 = require("express");
const shared_1 = require("@exam-platform/shared");
const riskEngine_1 = require("../modules/risk/riskEngine");
const rbac_1 = require("../middleware/rbac");
exports.aiEventRouter = (0, express_1.Router)();
// POST /ai/events — called by the Python AI service (internal)
exports.aiEventRouter.post('/events', async (req, res, next) => {
    try {
        // Simple API key check for internal service-to-service auth
        const apiKey = req.headers['x-internal-key'];
        if (apiKey !== process.env.INTERNAL_API_KEY && process.env.NODE_ENV !== 'development') {
            res.status(401).json({ success: false, error: 'Unauthorized' });
            return;
        }
        const result = shared_1.AIEventSchema.safeParse(req.body);
        if (!result.success) {
            res.status(400).json({ success: false, error: result.error.flatten() });
            return;
        }
        const engineResult = await (0, riskEngine_1.processAIEvent)(result.data);
        res.status(202).json({
            success: true,
            data: engineResult,
        });
    }
    catch (err) {
        next(err);
    }
});
// GET /ai/events/:sessionId — admin view of AI events for a session
exports.aiEventRouter.get('/events/:sessionId', rbac_1.authenticate, async (req, res, next) => {
    try {
        const { sessionId } = req.params;
        const { limit = '50', cursor } = req.query;
        const events = await (await Promise.resolve().then(() => __importStar(require('../lib/prisma')))).prisma.aIEvent.findMany({
            where: {
                sessionId,
                ...(cursor ? { id: { lt: cursor } } : {}),
            },
            take: parseInt(limit, 10),
            orderBy: { timestamp: 'desc' },
        });
        res.json({ success: true, data: events });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=aiEvent.routes.js.map