import { z } from 'zod'

export const updateSettingSchema = z.object({
  value: z.any() // JSON
})
