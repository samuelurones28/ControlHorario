"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportController = void 0;
const report_service_1 = require("./report.service");
const zod_1 = require("zod");
const reportService = new report_service_1.ReportService();
const dailyQuerySchema = zod_1.z.object({
    date: zod_1.z.string().datetime().or(zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
});
const exportQuerySchema = zod_1.z.object({
    from: zod_1.z.string().datetime().or(zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    to: zod_1.z.string().datetime().or(zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    format: zod_1.z.enum(['csv']).default('csv')
});
class ReportController {
    async getDailyReport(request, reply) {
        const query = dailyQuerySchema.parse(request.query);
        const companyId = request.user.companyId;
        try {
            const report = await reportService.getDailyReport(companyId, query.date);
            return reply.send(report);
        }
        catch (error) {
            return reply.status(400).send({ message: error.message });
        }
    }
    async exportCsv(request, reply) {
        const query = exportQuerySchema.parse(request.query);
        const companyId = request.user.companyId;
        try {
            const csv = await reportService.exportCsv(companyId, query.from, query.to);
            reply.header('Content-Type', 'text/csv');
            reply.header('Content-Disposition', `attachment; filename="report_${query.from}_${query.to}.csv"`);
            return reply.send(csv);
        }
        catch (error) {
            return reply.status(400).send({ message: error.message });
        }
    }
}
exports.ReportController = ReportController;
