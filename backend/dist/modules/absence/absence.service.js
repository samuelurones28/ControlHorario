"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbsenceService = void 0;
const prisma_1 = require("../../utils/prisma");
const client_1 = require("@prisma/client");
class AbsenceService {
    async calculateBusinessDays(startDate, endDate, companyId) {
        const s = new Date(startDate);
        s.setUTCHours(0, 0, 0, 0);
        const e = new Date(endDate);
        e.setUTCHours(23, 59, 59, 999);
        const holidays = await prisma_1.prisma.holiday.findMany({
            where: {
                companyId,
                date: { gte: s, lte: e }
            }
        });
        const holidayDates = holidays.map(h => h.date.toISOString().split('T')[0]);
        let current = new Date(s);
        let days = 0;
        while (current <= e) {
            const dayOfWeek = current.getUTCDay();
            const dateStr = current.toISOString().split('T')[0];
            // 0 is Sunday, 6 is Saturday
            if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidayDates.includes(dateStr)) {
                days++;
            }
            current.setUTCDate(current.getUTCDate() + 1);
        }
        return days;
    }
    async createRequest(employeeId, companyId, data) {
        const start = new Date(data.startDate);
        const end = new Date(data.endDate);
        if (end < start)
            throw new Error('EndDate debe ser mayor que StartDate');
        const businessDays = await this.calculateBusinessDays(start, end, companyId);
        return await prisma_1.prisma.absenceRequest.create({
            data: {
                employeeId,
                companyId,
                type: data.type,
                startDate: start,
                endDate: end,
                businessDays,
                notes: data.notes,
            }
        });
    }
    async createAdminRequest(companyId, data, adminId) {
        const start = new Date(data.startDate);
        const end = new Date(data.endDate);
        if (end < start)
            throw new Error('EndDate debe ser mayor que StartDate');
        const businessDays = await this.calculateBusinessDays(start, end, companyId);
        return await prisma_1.prisma.absenceRequest.create({
            data: {
                employeeId: data.employeeId,
                companyId,
                type: data.type,
                startDate: start,
                endDate: end,
                businessDays,
                notes: data.notes,
                status: data.status || client_1.AbsenceStatus.APPROVED,
                reviewedById: adminId,
                reviewedAt: new Date(),
            }
        });
    }
    async getMyRequests(employeeId) {
        return await prisma_1.prisma.absenceRequest.findMany({
            where: { employeeId },
            orderBy: { createdAt: 'desc' }
        });
    }
    async getCompanyRequests(companyId) {
        return await prisma_1.prisma.absenceRequest.findMany({
            where: { companyId },
            include: { employee: { select: { name: true, identifier: true } } },
            orderBy: { createdAt: 'desc' }
        });
    }
    async updateStatus(id, data, reviewerId, companyId) {
        const absence = await prisma_1.prisma.absenceRequest.findFirst({ where: { id, companyId } });
        if (!absence)
            throw new Error('Solicitud no encontrada para esta empresa');
        return await prisma_1.prisma.absenceRequest.update({
            where: { id },
            data: {
                status: data.status,
                reviewNote: data.reviewNote,
                reviewedById: reviewerId,
                reviewedAt: new Date()
            },
            include: { employee: { select: { name: true, identifier: true } } }
        });
    }
    async cancelRequest(id, employeeId) {
        const absence = await prisma_1.prisma.absenceRequest.findFirst({ where: { id, employeeId } });
        if (!absence)
            throw new Error('Solicitud no encontrada');
        if (absence.status !== 'PENDING')
            throw new Error('Solo se pueden cancelar solicitudes pendientes');
        return await prisma_1.prisma.absenceRequest.update({
            where: { id },
            data: { status: 'CANCELLED' }
        });
    }
}
exports.AbsenceService = AbsenceService;
