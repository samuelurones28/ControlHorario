"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditController = void 0;
const audit_service_1 = require("./audit.service");
const zod_1 = require("zod");
const auditService = new audit_service_1.AuditService();
const auditListQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().default(50).max(100),
});
class AuditController {
    async getAuditLogs(request, reply) {
        try {
            const query = auditListQuerySchema.parse(request.query);
            const companyId = request.tenant.companyId;
            const role = request.tenant.role;
            // Only ADMIN can access audit logs for their company
            if (role !== 'ADMIN') {
                return reply.status(403).send({ message: 'Access denied' });
            }
            const result = await auditService.getAuditLogs(companyId, query.page, query.limit);
            return reply.send(result);
        }
        catch (err) {
            if (err instanceof zod_1.z.ZodError) {
                return reply.status(400).send({ message: 'Invalid query parameters', errors: err.errors });
            }
            return reply.status(500).send({ message: 'Internal server error' });
        }
    }
}
exports.AuditController = AuditController;
