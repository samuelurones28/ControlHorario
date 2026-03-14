import { prisma } from '../../utils/prisma';
import crypto from 'crypto';

export class WeeklyReportService {
  async getMyPendingReports(employeeId: string) {
    return await prisma.weeklyReport.findMany({
      where: { employeeId, status: 'PENDING_REVIEW' },
      orderBy: { weekStart: 'desc' }
    });
  }

  async getMyReports(employeeId: string) {
    return await prisma.weeklyReport.findMany({
      where: { employeeId },
      orderBy: { weekStart: 'desc' }
    });
  }

  async acceptReport(reportId: string, employeeId: string) {
    const report = await prisma.weeklyReport.findFirst({
      where: { id: reportId, employeeId }
    });

    if (!report || report.status !== 'PENDING_REVIEW') {
      throw new Error('Report not found or not pending review');
    }

    const reviewedAt = new Date();
    const signatureBase = JSON.stringify(report.data) + employeeId + reviewedAt.toISOString();
    const signature = crypto.createHash('sha256').update(signatureBase).digest('hex');

    return await prisma.weeklyReport.update({
      where: { id: reportId },
      data: {
        status: 'ACCEPTED',
        reviewedAt,
        signature
      }
    });
  }

  async disputeReport(reportId: string, employeeId: string, disputeReason: string) {
    const report = await prisma.weeklyReport.findFirst({
      where: { id: reportId, employeeId }
    });

    if (!report || report.status !== 'PENDING_REVIEW') {
      throw new Error('Report not found or not pending review');
    }

    return await prisma.weeklyReport.update({
      where: { id: reportId },
      data: {
        status: 'DISPUTED',
        disputeReason,
        reviewedAt: new Date()
      }
    });
  }

  // Admin scopes
  async getAllReports(companyId: string) {
    return await prisma.weeklyReport.findMany({
      where: { companyId },
      include: { employee: { select: { name: true, identifier: true } } },
      orderBy: { weekStart: 'desc' }
    });
  }

  async getDisputedReports(companyId: string) {
    return await prisma.weeklyReport.findMany({
      where: { companyId, status: 'DISPUTED' },
      include: { employee: { select: { name: true, identifier: true } } },
      orderBy: { weekStart: 'desc' }
    });
  }
}
