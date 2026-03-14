"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.platformCompanyAuditLogQuerySchema = exports.platformCompanyStatusSchema = exports.platformCompaniesQuerySchema = void 0;
const zod_1 = require("zod");
exports.platformCompaniesQuerySchema = zod_1.z.object({
    search: zod_1.z.string().optional(),
    status: zod_1.z.enum(['active', 'inactive', 'all']).default('all'),
    page: zod_1.z.string().transform(Number).default("1"),
    limit: zod_1.z.string().transform(Number).default("50")
});
exports.platformCompanyStatusSchema = zod_1.z.object({
    active: zod_1.z.boolean(),
    reason: zod_1.z.string().min(5, "Debes proporcionar un motivo para el cambio de estado")
});
exports.platformCompanyAuditLogQuerySchema = zod_1.z.object({
    from: zod_1.z.string().datetime().optional(),
    to: zod_1.z.string().datetime().optional(),
    action: zod_1.z.string().optional()
});
