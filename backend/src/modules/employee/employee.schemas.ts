import { z } from 'zod';
import { Role } from '@prisma/client';

export const createEmployeeSchema = z.object({
  name: z.string().min(2),
  identifier: z.string().min(2),
  email: z.string().email().optional().or(z.literal('')),
  role: z.nativeEnum(Role).default(Role.EMPLOYEE),
  contractType: z.string().optional(),
  weeklyHours: z.number().optional()
});

export const updateEmployeeSchema = z.object({
  name: z.string().min(2).optional(),
  identifier: z.string().min(2).optional(),
  email: z.string().email().optional().or(z.literal('')),
  role: z.nativeEnum(Role).optional(),
  contractType: z.string().optional(),
  weeklyHours: z.number().optional(),
  active: z.boolean().optional()
});
