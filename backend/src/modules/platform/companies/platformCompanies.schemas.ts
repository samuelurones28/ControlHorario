import { z } from 'zod'

export const platformCompaniesQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(['active', 'inactive', 'all']).default('all'),
  page: z.string().transform(Number).default("1"),
  limit: z.string().transform(Number).default("50")
})

export const platformCompanyStatusSchema = z.object({
  active: z.boolean(),
  reason: z.string().min(5, "Debes proporcionar un motivo para el cambio de estado")
})

export const platformCompanyAuditLogQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  action: z.string().optional()
})
