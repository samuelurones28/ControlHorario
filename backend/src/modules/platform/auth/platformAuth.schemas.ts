import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
})

export const verifyTotpSchema = z.object({
  email: z.string().email(),
  totpCode: z.string().length(6)
})

export const setupTotpSchema = z.object({
  totpCode: z.string().length(6)
})

export const verifyRecoverySchema = z.object({
  email: z.string().email(),
  recoveryCode: z.string().min(8).max(9)
})

export type LoginInput = z.infer<typeof loginSchema>
export type VerifyTotpInput = z.infer<typeof verifyTotpSchema>
export type SetupTotpInput = z.infer<typeof setupTotpSchema>
export type VerifyRecoveryInput = z.infer<typeof verifyRecoverySchema>
