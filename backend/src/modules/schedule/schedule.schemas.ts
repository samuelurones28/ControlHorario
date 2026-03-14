import { z } from 'zod';

export const scheduleSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  isWorkDay: z.boolean(),
  employeeId: z.string().uuid().nullable().optional() // if null/omitted, applies to company
});

export const updateScheduleSchema = z.object({
  schedules: z.array(scheduleSchema)
});
