import { FastifyRequest, FastifyReply } from 'fastify';
import { CompanyHolidayService } from './company-holiday.service';
import { createHolidaysDto } from './company-holiday.schema';

export class CompanyHolidayController {
  private service: CompanyHolidayService;

  constructor() {
    this.service = new CompanyHolidayService();
  }

  async setCompanyHolidays(request: FastifyRequest, reply: FastifyReply) {
    const data = createHolidaysDto.parse(request.body);
    const result = await this.service.setCompanyHolidays(request.tenant!.companyId, data);
    return reply.status(201).send(result);
  }

  async listCompanyHolidays(request: FastifyRequest, reply: FastifyReply) {
    const result = await this.service.listCompanyHolidays(request.tenant!.companyId);
    return reply.send(result);
  }

  async deleteHoliday(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { id } = request.params;
    await this.service.deleteHoliday(request.tenant!.companyId, id);
    return reply.send({ success: true });
  }
}
