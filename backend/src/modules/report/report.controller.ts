import { FastifyReply, FastifyRequest } from 'fastify';
import { ReportService } from './report.service';
import { z } from 'zod';

const reportService = new ReportService();

const dailyQuerySchema = z.object({
  date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
});

const exportQuerySchema = z.object({
  from: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  to: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  format: z.enum(['csv', 'pdf']).default('csv')
});

export class ReportController {
  async getDailyReport(request: FastifyRequest, reply: FastifyReply) {
    const query = dailyQuerySchema.parse(request.query);
    const companyId = (request as any).user.companyId;

    try {
      const report = await reportService.getDailyReport(companyId, query.date);
      return reply.send(report);
    } catch (error: any) {
      return reply.status(400).send({ message: error.message });
    }
  }

  async exportReport(request: FastifyRequest, reply: FastifyReply) {
    const query = exportQuerySchema.parse(request.query);
    const companyId = (request as any).user.companyId;

    try {
      if (query.format === 'pdf') {
        const pdf = await reportService.exportPdf(companyId, query.from, query.to);
        reply.header('Content-Type', 'application/pdf');
        reply.header('Content-Disposition', `attachment; filename="report_${query.from}_${query.to}.pdf"`);
        return reply.send(pdf);
      } else {
        const csv = await reportService.exportCsv(companyId, query.from, query.to);
        reply.header('Content-Type', 'text/csv');
        reply.header('Content-Disposition', `attachment; filename="report_${query.from}_${query.to}.csv"`);
        return reply.send(csv);
      }
    } catch (error: any) {
      return reply.status(400).send({ message: error.message });
    }
  }
}
