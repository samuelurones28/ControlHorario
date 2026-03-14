import { FastifyInstance } from 'fastify';
import { WeeklyReportController } from './weeklyReport.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { auditLogger } from '../../middleware/auditLogger';

export async function weeklyReportRoutes(app: FastifyInstance) {
  const weeklyReportController = new WeeklyReportController();

  app.addHook('preValidation', authenticate);
  app.addHook('onResponse', auditLogger);

  // Employee endpoints
  app.get('/me/pending', weeklyReportController.getMyPendingReports.bind(weeklyReportController));
  app.get('/me', weeklyReportController.getMyReports.bind(weeklyReportController));
  app.post('/:id/accept', weeklyReportController.acceptReport.bind(weeklyReportController));
  app.post('/:id/dispute', weeklyReportController.disputeReport.bind(weeklyReportController));

  // Admin endpoints
  app.register(async (adminApp) => {
    adminApp.addHook('preValidation', authorize(['ADMIN']));
    adminApp.get('/all', weeklyReportController.getAllReports.bind(weeklyReportController));
    adminApp.get('/disputed', weeklyReportController.getDisputedReports.bind(weeklyReportController));
  });
}
