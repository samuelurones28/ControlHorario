import { z } from 'zod';

export const createHolidayDto = z.object({
  date: z.string().datetime(),
  name: z.string()
});
// array of dates to allow batch creation
export const createHolidaysDto = z.array(createHolidayDto);
export type CreateHolidaysDto = z.infer<typeof createHolidaysDto>;
