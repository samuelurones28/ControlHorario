import { FastifyInstance } from 'fastify';
import { CompanyHolidayController } from './company-holiday.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { auditLogger } from '../../middleware/auditLogger';

export async function companyHolidayRoutes(app: FastifyInstance) {
  const controller = new CompanyHolidayController();

  app.addHook('preValidation', authenticate);
  app.addHook('onResponse', auditLogger);

  app.get('/', controller.listCompanyHolidays.bind(controller));

  // Endpoints Administrador
  app.register(async (adminRoutes) => {
    adminRoutes.addHook('preValidation', authorize(['ADMIN']));
    adminRoutes.post('/', controller.setCompanyHolidays.bind(controller));
    adminRoutes.delete('/:id', controller.deleteHoliday.bind(controller));
  });
}
