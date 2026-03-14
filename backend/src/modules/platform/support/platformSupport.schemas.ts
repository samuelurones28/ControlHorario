import { z } from 'zod'

export const userSearchQuerySchema = z.object({
  email: z.string().optional(),
  identifier: z.string().optional(),
  companyCode: z.string().optional()
})

export const resetPasswordRequestSchema = z.object({}) // empty body typical for just triggering action

export const resetPinRequestSchema = z.object({}) // empty body typical
