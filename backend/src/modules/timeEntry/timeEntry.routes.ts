import { FastifyInstance } from 'fastify';
import { TimeEntryController } from './timeEntry.controller';
import { authenticate } from '../../middleware/authenticate';
import { auditLogger } from '../../middleware/auditLogger';

export async function timeEntryRoutes(app: FastifyInstance) {
  const timeEntryController = new TimeEntryController();

  // Protect all routes requiring authentication
  app.addHook('preValidation', authenticate);
  // Audit logger for state mutations
  app.addHook('onResponse', auditLogger);

  app.post('/clock', timeEntryController.clock.bind(timeEntryController));
  app.get('/me', timeEntryController.getMyHistory.bind(timeEntryController));

  // Admin route for all history
  app.register(async (adminApp) => {
    // dynamically import authorize to avoid circular deps if any but here we just require it
    const { authorize } = require('../../middleware/authorize');
    adminApp.addHook('preValidation', authorize(['ADMIN']));
    adminApp.get('/all', timeEntryController.getAllHistory.bind(timeEntryController));
  });
}
