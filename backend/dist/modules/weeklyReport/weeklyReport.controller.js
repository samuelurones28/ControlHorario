"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WeeklyReportController = void 0;
const weeklyReport_service_1 = require("./weeklyReport.service");
const weeklyReport_schemas_1 = require("./weeklyReport.schemas");
const weeklyReportService = new weeklyReport_service_1.WeeklyReportService();
class WeeklyReportController {
    async getMyPendingReports(request, reply) {
        const employeeId = request.tenant.employeeId;
        const reports = await weeklyReportService.getMyPendingReports(employeeId);
        return reply.send(reports);
    }
    async getMyReports(request, reply) {
        const employeeId = request.tenant.employeeId;
        const reports = await weeklyReportService.getMyReports(employeeId);
        return reply.send(reports);
    }
    async acceptReport(request, reply) {
        const employeeId = request.tenant.employeeId;
        const { id } = request.params;
        try {
            const report = await weeklyReportService.acceptReport(id, employeeId);
            return reply.send(report);
        }
        catch (error) {
            return reply.status(400).send({ message: error.message });
        }
    }
    async disputeReport(request, reply) {
        const employeeId = request.tenant.employeeId;
        const { id } = request.params;
        const data = weeklyReport_schemas_1.disputeReportSchema.parse(request.body);
        try {
            const report = await weeklyReportService.disputeReport(id, employeeId, data.disputeReason);
            return reply.send(report);
        }
        catch (error) {
            return reply.status(400).send({ message: error.message });
        }
    }
    async getAllReports(request, reply) {
        const companyId = request.tenant.companyId;
        const reports = await weeklyReportService.getAllReports(companyId);
        return reply.send(reports);
    }
    async getDisputedReports(request, reply) {
        const companyId = request.tenant.companyId;
        const reports = await weeklyReportService.getDisputedReports(companyId);
        return reply.send(reports);
    }
}
exports.WeeklyReportController = WeeklyReportController;
