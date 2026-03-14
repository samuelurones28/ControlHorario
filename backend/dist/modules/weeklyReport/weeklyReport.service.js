"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WeeklyReportService = void 0;
const prisma_1 = require("../../utils/prisma");
const crypto_1 = __importDefault(require("crypto"));
class WeeklyReportService {
    async getMyPendingReports(employeeId) {
        return await prisma_1.prisma.weeklyReport.findMany({
            where: { employeeId, status: 'PENDING_REVIEW' },
            orderBy: { weekStart: 'desc' }
        });
    }
    async getMyReports(employeeId) {
        return await prisma_1.prisma.weeklyReport.findMany({
            where: { employeeId },
            orderBy: { weekStart: 'desc' }
        });
    }
    async acceptReport(reportId, employeeId) {
        const report = await prisma_1.prisma.weeklyReport.findFirst({
            where: { id: reportId, employeeId }
        });
        if (!report || report.status !== 'PENDING_REVIEW') {
            throw new Error('Report not found or not pending review');
        }
        const reviewedAt = new Date();
        const signatureBase = JSON.stringify(report.data) + employeeId + reviewedAt.toISOString();
        const signature = crypto_1.default.createHash('sha256').update(signatureBase).digest('hex');
        return await prisma_1.prisma.weeklyReport.update({
            where: { id: reportId },
            data: {
                status: 'ACCEPTED',
                reviewedAt,
                signature
            }
        });
    }
    async disputeReport(reportId, employeeId, disputeReason) {
        const report = await prisma_1.prisma.weeklyReport.findFirst({
            where: { id: reportId, employeeId }
        });
        if (!report || report.status !== 'PENDING_REVIEW') {
            throw new Error('Report not found or not pending review');
        }
        return await prisma_1.prisma.weeklyReport.update({
            where: { id: reportId },
            data: {
                status: 'DISPUTED',
                disputeReason,
                reviewedAt: new Date()
            }
        });
    }
    // Admin scopes
    async getAllReports(companyId) {
        return await prisma_1.prisma.weeklyReport.findMany({
            where: { companyId },
            include: { employee: { select: { name: true, identifier: true } } },
            orderBy: { weekStart: 'desc' }
        });
    }
    async getDisputedReports(companyId) {
        return await prisma_1.prisma.weeklyReport.findMany({
            where: { companyId, status: 'DISPUTED' },
            include: { employee: { select: { name: true, identifier: true } } },
            orderBy: { weekStart: 'desc' }
        });
    }
}
exports.WeeklyReportService = WeeklyReportService;
