import { FastifyInstance } from 'fastify';
import { AbsenceController } from './absence.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { auditLogger } from '../../middleware/auditLogger';

export async function absenceRoutes(app: FastifyInstance) {
  const controller = new AbsenceController();

  app.addHook('preValidation', authenticate);
  app.addHook('onResponse', auditLogger);

  // Endpoints Empleado
  app.post('/', controller.createRequest.bind(controller));
  app.get('/my', controller.getMyRequests.bind(controller));
  app.patch('/:id/cancel', controller.cancelRequest.bind(controller));

  // Endpoints Administrador
  app.register(async (adminRoutes) => {
    adminRoutes.addHook('preValidation', authorize(['ADMIN']));
    adminRoutes.post('/admin', controller.createAdminRequest.bind(controller));
    adminRoutes.get('/company', controller.getCompanyRequests.bind(controller));
    adminRoutes.patch('/:id/status', controller.updateStatus.bind(controller));
  });
}
