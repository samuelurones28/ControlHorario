import { prisma } from '../../utils/prisma';
import { AmendmentAction, EntryType } from '@prisma/client';

export class AmendmentService {
  async createAmendment(adminId: string, companyId: string, data: any) {
    let originalTimestamp = null;
    if (data.originalEntryId) {
       const entry = await prisma.timeEntry.findUnique({ where: { id: data.originalEntryId } });
       if (entry) originalTimestamp = entry.timestamp;
    }

    const amendment = await prisma.timeEntryAmendment.create({
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
      await prisma.incident.update({
        where: { id: data.incidentId },
        data: { status: 'RESOLVED', resolvedById: adminId, resolvedAt: new Date() }
      });
    }

    return amendment;
  }

  async getAdminAmendments(companyId: string) {
    return await prisma.timeEntryAmendment.findMany({
      where: { companyId },
      include: { admin: { select: { name: true } }, incident: true, originalEntry: true },
      orderBy: { createdAt: 'desc' }
    });
  }
}
