"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const auth_routes_1 = require("./routes/auth.routes");
const user_routes_1 = require("./routes/user.routes");
const errorHandler_1 = require("./middleware/errorHandler");
const logger_1 = require("./utils/logger");
const prisma_1 = require("./lib/prisma");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 4001;
// ─── Middleware ───────────────────────────────────────────────────────────────
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
}));
app.use(express_1.default.json({ limit: '10kb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// ─── Routes ───────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'auth-service', timestamp: new Date().toISOString() });
});
app.use('/v1/auth', auth_routes_1.authRouter);
app.use('/v1/users', user_routes_1.userRouter);
// ─── Error Handler ────────────────────────────────────────────────────────────
app.use(errorHandler_1.errorHandler);
// ─── Start ────────────────────────────────────────────────────────────────────
async function start() {
    try {
        await prisma_1.prisma.$connect();
        logger_1.logger.info('✅ Database connected');
        app.listen(PORT, () => {
            logger_1.logger.info(`🚀 Auth service running on port ${PORT}`);
        });
    }
    catch (err) {
        logger_1.logger.error('❌ Failed to start auth service:', err);
        process.exit(1);
    }
}
start();
//# sourceMappingURL=index.js.map