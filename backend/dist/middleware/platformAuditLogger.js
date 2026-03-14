"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.platformAuditLogger = platformAuditLogger;
const prisma_1 = require("../utils/prisma");
async function platformAuditLogger(request, reply) {
    // Only log mutating requests or specific view requests that require auditing
    if (['POST', 'PUT', 'PATCH', 'DELETE', 'GET'].includes(request.method) && reply.statusCode < 400) {
        const admin = request.platformAdmin;
        if (!admin)
            return; // if no admin context, it's either not authed or failed before this
        // Skip GET requests unless they are to specific sensitive endpoints like audit-logs
        if (request.method === 'GET' && !request.url.includes('audit-log') && !request.url.includes('/users/search')) {
            return;
        }
        const urlParts = request.url.split('?')[0].split('/').filter(Boolean);
        // /api/v1/platform/companies/... -> entity is companies
        const entity = urlParts[3] || 'platform_system';
        const action = request.method;
        // Mask sensitive fields in body
        let cleanBody = undefined;
        if (request.body) {
            if (typeof request.body === 'object') {
                cleanBody = { ...request.body };
                if ('password' in cleanBody)
                    cleanBody.password = '***';
                if ('totpCode' in cleanBody)
                    cleanBody.totpCode = '***';
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
        prisma_1.prisma.platformAuditLog.create({
            data: {
                platformAdminId: admin.id,
                action,
                entity,
                entityId: request.params?.id || null,
                details: JSON.stringify(details),
                ipAddress: request.ip,
                userAgent: request.headers['user-agent']
            }
        }).catch(err => {
            request.log.error('Failed to create platform audit log', err);
        });
    }
}
