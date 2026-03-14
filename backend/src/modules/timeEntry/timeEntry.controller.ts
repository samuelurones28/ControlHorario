import { FastifyReply, FastifyRequest } from 'fastify';
import { TimeEntryService } from './timeEntry.service';
import { clockSchema, historyQuerySchema } from './timeEntry.schemas';

const timeEntryService = new TimeEntryService();

export class TimeEntryController {
  async clock(request: FastifyRequest, reply: FastifyReply) {
    const data = clockSchema.parse(request.body);
    const employeeId = request.tenant?.employeeId;
    if (!employeeId) {
      return reply.status(401).send({ message: 'Unauthorized: No employee ID' });
    }
    const ipAddress = request.ip;
    const deviceInfo = request.headers['user-agent'];

    try {
      const entry = await timeEntryService.clock(employeeId, data, ipAddress, deviceInfo);
      return reply.status(201).send(entry);
    } catch (error: any) {
      return reply.status(400).send({ message: error.message || 'Error processing clock action' });
    }
  }

  async getMyHistory(request: FastifyRequest, reply: FastifyReply) {
    const query = historyQuerySchema.parse(request.query || {});
    const employeeId = request.tenant?.employeeId;
    if (!employeeId) {
      return reply.status(401).send({ message: 'Unauthorized: No employee ID' });
    }

    const history = await timeEntryService.getMyHistory(employeeId, query.from, query.to);
    return reply.send(history);
  }

  async getAllHistory(request: FastifyRequest, reply: FastifyReply) {
    const query = request.query as any;
    const companyId = request.tenant?.companyId;
    if (!companyId) {
      return reply.status(401).send({ message: 'Unauthorized: No company ID' });
    }

    const history = await timeEntryService.getAllHistory(companyId, query.employeeId, query.from, query.to);
    return reply.send(history);
  }
}
