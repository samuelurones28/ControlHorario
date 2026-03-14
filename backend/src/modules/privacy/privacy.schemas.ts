import { z } from 'zod';

export const privacyConsentSchema = z.object({
  version: z.string().min(1),
  ipAddress: z.string().optional()
});
