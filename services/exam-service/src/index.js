"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const exam_routes_1 = require("./routes/exam.routes");
const session_routes_1 = require("./routes/session.routes");
const aiEvent_routes_1 = require("./routes/aiEvent.routes");
const admin_routes_1 = require("./routes/admin.routes");
const question_routes_1 = require("./routes/question.routes");
const errorHandler_1 = require("./middleware/errorHandler");
const logger_1 = require("./utils/logger");
const prisma_1 = require("./lib/prisma");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 4002;
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
}));
app.use(express_1.default.json({ limit: '10kb' }));
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'exam-service', timestamp: new Date().toISOString() });
});
app.use('/v1/exams', exam_routes_1.examRouter);
app.use('/v1/questions', question_routes_1.questionRouter);
app.use('/v1/sessions', session_routes_1.sessionRouter);
app.use('/v1/ai', aiEvent_routes_1.aiEventRouter);
app.use('/v1/admin', admin_routes_1.adminRouter);
app.use(errorHandler_1.errorHandler);
async function start() {
    await prisma_1.prisma.$connect();
    logger_1.logger.info('✅ Database connected');
    app.listen(PORT, () => logger_1.logger.info(`🚀 Exam service running on port ${PORT}`));
}
start().catch((err) => { logger_1.logger.error(err); process.exit(1); });
//# sourceMappingURL=index.js.map