import { z } from 'zod';
import { AbsenceType, AbsenceStatus } from '@prisma/client';

export const createAbsenceDto = z.object({
  type: z.nativeEnum(AbsenceType),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  notes: z.string().optional(),
});
export type CreateAbsenceDto = z.infer<typeof createAbsenceDto>;

export const adminCreateAbsenceDto = createAbsenceDto.extend({
  employeeId: z.string().uuid(),
  status: z.nativeEnum(AbsenceStatus).optional(),
});
export type AdminCreateAbsenceDto = z.infer<typeof adminCreateAbsenceDto>;

export const updateAbsenceStatusDto = z.object({
  status: z.nativeEnum(AbsenceStatus),
  reviewNote: z.string().optional(),
});
export type UpdateAbsenceStatusDto = z.infer<typeof updateAbsenceStatusDto>;
