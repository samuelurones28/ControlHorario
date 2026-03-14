"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.platformAuthorize = void 0;
const platformAuthorize = (allowedRoles) => {
    return async (request, reply) => {
        const admin = request.platformAdmin;
        if (!admin) {
            return reply.code(401).send({ error: 'Unauthorized: No active admin session found' });
        }
        if (!allowedRoles.includes(admin.role)) {
            return reply.code(403).send({ error: 'Forbidden: Insufficient platform permissions' });
        }
    };
};
exports.platformAuthorize = platformAuthorize;
