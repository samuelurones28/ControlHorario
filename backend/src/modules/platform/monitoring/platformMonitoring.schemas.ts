import { z } from 'zod'

export const getMonitoringErrorsQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  severity: z.string().optional()
})

export const getMonitoringMetricsQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional()
})
