import { FastifyRequest, FastifyReply } from 'fastify';
import { AbsenceService } from './absence.service';
import { createAbsenceDto, adminCreateAbsenceDto, updateAbsenceStatusDto } from './absence.schema';

export class AbsenceController {
  private absenceService: AbsenceService;

  constructor() {
    this.absenceService = new AbsenceService();
  }

  async createRequest(request: FastifyRequest, reply: FastifyReply) {
    const data = createAbsenceDto.parse(request.body);
    const result = await this.absenceService.createRequest(request.tenant!.employeeId, request.tenant!.companyId, data);
    return reply.status(201).send(result);
  }

  async createAdminRequest(request: FastifyRequest, reply: FastifyReply) {
    const data = adminCreateAbsenceDto.parse(request.body);
    const result = await this.absenceService.createAdminRequest(request.tenant!.companyId, data, request.tenant!.employeeId);
    return reply.status(201).send(result);
  }

  async getMyRequests(request: FastifyRequest, reply: FastifyReply) {
    const result = await this.absenceService.getMyRequests(request.tenant!.employeeId);
    return reply.send(result);
  }

  async getCompanyRequests(request: FastifyRequest, reply: FastifyReply) {
    const result = await this.absenceService.getCompanyRequests(request.tenant!.companyId);
    return reply.send(result);
  }

  async updateStatus(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { id } = request.params;
    const data = updateAbsenceStatusDto.parse(request.body);
    const result = await this.absenceService.updateStatus(id, data, request.tenant!.employeeId, request.tenant!.companyId);
    return reply.send(result);
  }

  async cancelRequest(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { id } = request.params;
    const result = await this.absenceService.cancelRequest(id, request.tenant!.employeeId);
    return reply.send(result);
  }
}
