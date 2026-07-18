"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const report_routes_1 = require("./routes/report.routes");
const logger_1 = require("./utils/logger");
const app = (0, express_1.default)();
exports.app = app;
const PORT = process.env.PORT || 4005;
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'report-service', timestamp: new Date().toISOString() });
});
app.use('/v1/reports', report_routes_1.reportRouter);
app.listen(PORT, () => {
    logger_1.logger.info(`🚀 Report service running on port ${PORT}`);
});
//# sourceMappingURL=index.js.map