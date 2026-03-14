import { FastifyInstance } from 'fastify';
import { ReportController } from './report.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { auditLogger } from '../../middleware/auditLogger';

export async function reportRoutes(app: FastifyInstance) {
  const reportController = new ReportController();

  app.addHook('preValidation', authenticate);
  app.addHook('preValidation', authorize(['ADMIN']));
  app.addHook('onResponse', auditLogger);

  app.get('/daily', reportController.getDailyReport.bind(reportController));
  app.get('/export', reportController.exportReport.bind(reportController));
}
