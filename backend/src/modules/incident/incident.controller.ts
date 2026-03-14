import { FastifyReply, FastifyRequest } from 'fastify';
import { IncidentService } from './incident.service';
import { createIncidentSchema } from './incident.schemas';

const incidentService = new IncidentService();

export class IncidentController {
  async createIncident(request: FastifyRequest, reply: FastifyReply) {
    const data = createIncidentSchema.parse(request.body);
    const employeeId = request.tenant!.employeeId;

    try {
      const incident = await incidentService.createIncident(employeeId, data);
      return reply.status(201).send(incident);
    } catch (error: any) {
      return reply.status(400).send({ message: error.message || 'Error processing request' });
    }
  }

  async getMyIncidents(request: FastifyRequest, reply: FastifyReply) {
    const employeeId = request.tenant!.employeeId;
    const incidents = await incidentService.getMyIncidents(employeeId);
    return reply.send(incidents);
  }

  async getAllIncidents(request: FastifyRequest, reply: FastifyReply) {
    const companyId = request.tenant!.companyId;
    const { status } = request.query as { status?: string };
    const incidents = await incidentService.getAllIncidents(companyId, status);
    return reply.send(incidents);
  }
}
