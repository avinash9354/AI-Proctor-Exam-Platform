"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.requireRole = requireRole;
exports.requirePermission = requirePermission;
const jwt_1 = require("../utils/jwt");
const shared_1 = require("@exam-platform/shared");
const prisma_1 = require("../lib/prisma");
// ─── Authenticate ─────────────────────────────────────────────────────────────
async function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ success: false, error: 'Missing or invalid authorization header' });
        return;
    }
    const token = authHeader.slice(7);
    try {
        // Check blacklist first
        if (await (0, jwt_1.isTokenBlacklisted)(token)) {
            res.status(401).json({ success: false, error: 'Token has been revoked' });
            return;
        }
        const payload = (0, jwt_1.verifyAccessToken)(token);
        req.user = {
            id: payload.sub,
            email: payload.email,
            role: payload.role,
        };
        next();
    }
    catch {
        res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }
}
// ─── RBAC ─────────────────────────────────────────────────────────────────────
function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ success: false, error: 'Unauthenticated' });
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({ success: false, error: 'Insufficient permissions' });
            return;
        }
        next();
    };
}
// ─── Permission Check (resource + action) ────────────────────────────────────
function requirePermission(resource, action) {
    return async (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ success: false, error: 'Unauthenticated' });
            return;
        }
        // super_admin and admin bypass permission checks
        if (req.user.role === shared_1.UserRole.SUPER_ADMIN || req.user.role === shared_1.UserRole.ADMIN) {
            next();
            return;
        }
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: req.user.id },
            include: {
                role: {
                    include: { permissions: true },
                },
            },
        });
        const hasPermission = user?.role.permissions.some((p) => (p.resource === '*' || p.resource === resource) &&
            (p.action === '*' || p.action === action));
        if (!hasPermission) {
            res.status(403).json({ success: false, error: 'Insufficient permissions' });
            return;
        }
        next();
    };
}
//# sourceMappingURL=rbac.js.map