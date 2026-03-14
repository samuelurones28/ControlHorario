"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const prisma_1 = require("../../utils/prisma");
class AuditService {
    async getAuditLogs(companyId, page, limit) {
        const skip = (page - 1) * limit;
        // Get audit logs for employees in this company
        const [logs, total] = await Promise.all([
            prisma_1.prisma.auditLog.findMany({
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
            prisma_1.prisma.auditLog.count({
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
exports.AuditService = AuditService;
