import { FastifyReply, FastifyRequest } from 'fastify';
import { AmendmentService } from './amendment.service';
import { createAmendmentSchema } from './amendment.schemas';

const amendmentService = new AmendmentService();

export class AmendmentController {
  async createAmendment(request: FastifyRequest, reply: FastifyReply) {
    const data = createAmendmentSchema.parse(request.body);
    const adminId = request.tenant!.userId;
    const companyId = request.tenant!.companyId;

    try {
      const amendment = await amendmentService.createAmendment(adminId, companyId, data);
      return reply.status(201).send(amendment);
    } catch (error: any) {
      return reply.status(400).send({ message: error.message || 'Error processing request' });
    }
  }

  async getAdminAmendments(request: FastifyRequest, reply: FastifyReply) {
    const companyId = request.tenant!.companyId;
    const amendments = await amendmentService.getAdminAmendments(companyId);
    return reply.send(amendments);
  }
}
