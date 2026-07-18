"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const database_1 = require("@exam-platform/database");
const logger_1 = require("../utils/logger");
exports.prisma = global.__prisma ??
    new database_1.PrismaClient({
        datasourceUrl: 'file:/Users/avinashpandey/Desktop/App/packages/database/prisma/dev.db',
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
if (process.env.NODE_ENV !== 'production') {
    global.__prisma = exports.prisma;
}
process.on('beforeExit', async () => {
    await exports.prisma.$disconnect();
    logger_1.logger.info('Prisma disconnected');
});
//# sourceMappingURL=prisma.js.map