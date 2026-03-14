"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLogger = auditLogger;
const prisma_1 = require("../utils/prisma");
async function auditLogger(request, reply) {
    // We only log mutating requests that affect the system state
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method) && reply.statusCode < 400) {
        const employeeId = request.user?.id || undefined;
        // Simple heuristic to get entity name from URL (e.g., /api/v1/employees -> employees)
        const urlParts = request.url.split('?')[0].split('/').filter(Boolean);
        const entity = urlParts[2] || 'system';
        const action = request.method;
        // Mask sensitive fields in body
        let cleanBody = undefined;
        if (request.body) {
            if (typeof request.body === 'object') {
                cleanBody = { ...request.body };
                if ('password' in cleanBody)
                    cleanBody.password = '***';
                if ('pin' in cleanBody)
                    cleanBody.pin = '***';
            }
            else {
                cleanBody = request.body;
            }
        }
        const details = {
            path: request.url,
            body: cleanBody,
            params: request.params,
        };
        // Fire and forget
        prisma_1.prisma.auditLog.create({
            data: {
                employeeId,
                action,
                entity,
                entityId: request.params?.id || 'unknown',
                details: details,
                ipAddress: request.ip,
            }
        }).catch(err => {
            request.log.error('Failed to create audit log', err);
        });
    }
}
