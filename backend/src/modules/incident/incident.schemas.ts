import { z } from 'zod';

export const createIncidentSchema = z.object({
  timeEntryId: z.string().uuid().optional(),
  date: z.string().datetime(),
  description: z.string().min(5)
});
