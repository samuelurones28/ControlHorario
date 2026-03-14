import { FastifyReply, FastifyRequest } from 'fastify';
import { WeeklyReportService } from './weeklyReport.service';
import { disputeReportSchema } from './weeklyReport.schemas';

const weeklyReportService = new WeeklyReportService();

export class WeeklyReportController {
  async getMyPendingReports(request: FastifyRequest, reply: FastifyReply) {
    const employeeId = request.tenant!.employeeId;
    const reports = await weeklyReportService.getMyPendingReports(employeeId);
    return reply.send(reports);
  }

  async getMyReports(request: FastifyRequest, reply: FastifyReply) {
    const employeeId = request.tenant!.employeeId;
    const reports = await weeklyReportService.getMyReports(employeeId);
    return reply.send(reports);
  }

  async acceptReport(request: FastifyRequest, reply: FastifyReply) {
    const employeeId = request.tenant!.employeeId;
    const { id } = request.params as { id: string };
    
    try {
      const report = await weeklyReportService.acceptReport(id, employeeId);
      return reply.send(report);
    } catch (error: any) {
      return reply.status(400).send({ message: error.message });
    }
  }

  async disputeReport(request: FastifyRequest, reply: FastifyReply) {
    const employeeId = request.tenant!.employeeId;
    const { id } = request.params as { id: string };
    const data = disputeReportSchema.parse(request.body);

    try {
      const report = await weeklyReportService.disputeReport(id, employeeId, data.disputeReason);
      return reply.send(report);
    } catch (error: any) {
      return reply.status(400).send({ message: error.message });
    }
  }

  async getAllReports(request: FastifyRequest, reply: FastifyReply) {
    const companyId = request.tenant!.companyId;
    const reports = await weeklyReportService.getAllReports(companyId);
    return reply.send(reports);
  }

  async getDisputedReports(request: FastifyRequest, reply: FastifyReply) {
    const companyId = request.tenant!.companyId;
    const reports = await weeklyReportService.getDisputedReports(companyId);
    return reply.send(reports);
  }
}
