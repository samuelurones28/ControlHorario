import { z } from 'zod';
import { EntryType } from '@prisma/client';

export const clockSchema = z.object({
  entryType: z.nativeEnum(EntryType),
  latitude: z.number().optional(),
  longitude: z.number().optional()
});

export const historyQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});
