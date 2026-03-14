import { z } from 'zod';

export const disputeReportSchema = z.object({
  disputeReason: z.string().min(5)
});
