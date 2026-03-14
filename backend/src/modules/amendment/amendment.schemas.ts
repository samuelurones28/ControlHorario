import { z } from 'zod';
import { AmendmentAction, EntryType } from '@prisma/client';

export const createAmendmentSchema = z.object({
  incidentId: z.string().uuid().optional(),
  originalEntryId: z.string().uuid().optional(),
  employeeId: z.string().uuid(),
  action: z.nativeEnum(AmendmentAction),
  newTimestamp: z.string().datetime(),
  entryType: z.nativeEnum(EntryType),
  reason: z.string().min(5)
});
