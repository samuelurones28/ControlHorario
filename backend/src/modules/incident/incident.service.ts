import { prisma } from '../../utils/prisma';

export class IncidentService {
  async createIncident(employeeId: string, data: any) {
    return await prisma.incident.create({
      data: {
        employeeId,
        timeEntryId: data.timeEntryId || null,
        date: new Date(data.date),
        description: data.description,
        status: 'OPEN'
      }
    });
  }

  async getMyIncidents(employeeId: string) {
    return await prisma.incident.findMany({
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
  async getAllIncidents(companyId: string, status?: string) {
    const whereClause: any = { employee: { companyId } };
    if (status) whereClause.status = status;

    return await prisma.incident.findMany({
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
