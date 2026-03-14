import { FastifyInstance } from 'fastify';
import { EmployeeController } from './employee.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { auditLogger } from '../../middleware/auditLogger';

export async function employeeRoutes(app: FastifyInstance) {
  const employeeController = new EmployeeController();

  app.addHook('preValidation', authenticate);
  app.addHook('preValidation', authorize(['ADMIN']));
  app.addHook('onResponse', auditLogger);

  app.get('/', employeeController.listEmployees.bind(employeeController));
  app.post('/', employeeController.createEmployee.bind(employeeController));
  app.patch('/:id', employeeController.updateEmployee.bind(employeeController));
  app.delete('/:id', employeeController.deleteEmployee.bind(employeeController));
}
