"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IncidentService = void 0;
const prisma_1 = require("../../utils/prisma");
class IncidentService {
    async createIncident(employeeId, data) {
        return await prisma_1.prisma.incident.create({
            data: {
                employeeId,
                timeEntryId: data.timeEntryId || null,
                date: new Date(data.date),
                description: data.description,
                status: 'OPEN'
            }
        });
    }
    async getMyIncidents(employeeId) {
        return await prisma_1.prisma.incident.findMany({
            where: { employeeId },
            include: {
                timeEntry: true,
                amendments: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }
    // Admin Scopes
    async getAllIncidents(companyId, status) {
        const whereClause = { employee: { companyId } };
        if (status)
            whereClause.status = status;
        return await prisma_1.prisma.incident.findMany({
            where: whereClause,
            include: {
                employee: { select: { name: true, identifier: true } },
                timeEntry: true,
                amendments: { orderBy: { createdAt: 'desc' }, take: 1 }
            },
            orderBy: { createdAt: 'desc' }
        });
    }
}
exports.IncidentService = IncidentService;
