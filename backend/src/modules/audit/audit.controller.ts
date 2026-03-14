import { FastifyReply, FastifyRequest } from 'fastify';
import { AuditService } from './audit.service';
import { z } from 'zod';

const auditService = new AuditService();

const auditListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(50).max(100),
});

export class AuditController {
  async getAuditLogs(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = auditListQuerySchema.parse(request.query);
      const companyId = request.tenant!.companyId;
      const role = request.tenant!.role;

      // Only ADMIN can access audit logs for their company
      if (role !== 'ADMIN') {
        return reply.status(403).send({ message: 'Access denied' });
      }

      const result = await auditService.getAuditLogs(companyId, query.page, query.limit);
      return reply.send(result);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return reply.status(400).send({ message: 'Invalid query parameters', errors: err.errors });
      }
      return reply.status(500).send({ message: 'Internal server error' });
    }
  }
}
