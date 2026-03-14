"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AmendmentService = void 0;
const prisma_1 = require("../../utils/prisma");
class AmendmentService {
    async createAmendment(adminId, companyId, data) {
        let originalTimestamp = null;
        if (data.originalEntryId) {
            const entry = await prisma_1.prisma.timeEntry.findUnique({ where: { id: data.originalEntryId } });
            if (entry)
                originalTimestamp = entry.timestamp;
        }
        const amendment = await prisma_1.prisma.timeEntryAmendment.create({
            data: {
                incidentId: data.incidentId,
                originalEntryId: data.originalEntryId,
                employeeId: data.employeeId,
                companyId,
                action: data.action,
                originalTimestamp,
                newTimestamp: new Date(data.newTimestamp),
                entryType: data.entryType,
                reason: data.reason,
                createdBy: adminId,
            }
        });
        if (data.incidentId) {
            await prisma_1.prisma.incident.update({
                where: { id: data.incidentId },
                data: { status: 'RESOLVED', resolvedById: adminId, resolvedAt: new Date() }
            });
        }
        return amendment;
    }
    async getAdminAmendments(companyId) {
        return await prisma_1.prisma.timeEntryAmendment.findMany({
            where: { companyId },
            include: { admin: { select: { name: true } }, incident: true, originalEntry: true },
            orderBy: { createdAt: 'desc' }
        });
    }
}
exports.AmendmentService = AmendmentService;
