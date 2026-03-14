import { prisma } from '../../utils/prisma';

export class AuditService {
  async getAuditLogs(companyId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    // Get audit logs for employees in this company
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: {
          employee: {
            companyId: companyId,
          },
        },
        include: {
          employee: {
            select: {
              id: true,
              name: true,
              identifier: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({
        where: {
          employee: {
            companyId: companyId,
          },
        },
      }),
    ]);

    return {
      data: logs.map((log) => ({
        id: log.id,
        action: log.action,
        entity: log.entity,
        entityId: log.entityId,
        employee: log.employee
          ? {
              id: log.employee.id,
              name: log.employee.name,
              identifier: log.employee.identifier,
            }
          : null,
        ipAddress: log.ipAddress,
        createdAt: log.createdAt,
        details: log.details,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }
}
