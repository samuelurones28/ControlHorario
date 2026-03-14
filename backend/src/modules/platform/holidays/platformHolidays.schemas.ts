import { z } from 'zod'

export const getHolidaysQuerySchema = z.object({
  year: z.string().transform(Number).optional(),
  region: z.string().optional()
})

export const createHolidaySchema = z.object({
  date: z.string().datetime(),
  name: z.string().min(2),
  region: z.string().default('ES')
})

export const updateHolidaySchema = z.object({
  name: z.string().min(2).optional(),
  region: z.string().optional()
})
