import { FastifyInstance } from 'fastify';
import { AmendmentController } from './amendment.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { auditLogger } from '../../middleware/auditLogger';

export async function amendmentRoutes(app: FastifyInstance) {
  const amendmentController = new AmendmentController();

  app.addHook('preValidation', authenticate);
  app.addHook('onResponse', auditLogger);

  app.post('/', amendmentController.createAmendment.bind(amendmentController));
  app.register(async (adminApp) => {
    adminApp.addHook('preValidation', authorize(['ADMIN']));
    adminApp.get('/', amendmentController.getAdminAmendments.bind(amendmentController));
  });
}
