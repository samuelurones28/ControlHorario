import { FastifyInstance } from 'fastify';
import { AuditController } from './audit.controller';
import { authenticate } from '../../middleware/authenticate';

export async function auditRoutes(app: FastifyInstance) {
  const auditController = new AuditController();

  app.get('/', {
    preHandler: authenticate,
  }, auditController.getAuditLogs.bind(auditController));
}
