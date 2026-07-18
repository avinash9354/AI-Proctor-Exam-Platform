"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const database_1 = require("@exam-platform/database");
const globalForPrisma = globalThis;
exports.prisma = globalForPrisma.prisma ?? new database_1.PrismaClient({
    datasourceUrl: 'file:/Users/avinashpandey/Desktop/App/packages/database/prisma/dev.db',
});
if (process.env.NODE_ENV !== 'production')
    globalForPrisma.prisma = exports.prisma;
//# sourceMappingURL=prisma.js.map