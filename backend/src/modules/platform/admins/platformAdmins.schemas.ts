import { z } from 'zod'

export const createAdminSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  role: z.enum(['SUPER_ADMIN', 'SUPPORT', 'VIEWER']),
  password: z.string().min(8)
})

export const updateAdminSchema = z.object({
  role: z.enum(['SUPER_ADMIN', 'SUPPORT', 'VIEWER']).optional(),
  active: z.boolean().optional()
})
