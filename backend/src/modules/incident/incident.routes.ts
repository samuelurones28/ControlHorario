import { FastifyInstance } from 'fastify';
import { IncidentController } from './incident.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { auditLogger } from '../../middleware/auditLogger';

export async function incidentRoutes(app: FastifyInstance) {
  const incidentController = new IncidentController();

  app.addHook('preValidation', authenticate);
  app.addHook('onResponse', auditLogger);

  app.post('/', incidentController.createIncident.bind(incidentController));
  app.get('/me', incidentController.getMyIncidents.bind(incidentController));

  // Admin endpoints
  app.register(async (adminApp) => {
    adminApp.addHook('preValidation', authorize(['ADMIN']));
    adminApp.get('/all', incidentController.getAllIncidents.bind(incidentController));
  });
}
