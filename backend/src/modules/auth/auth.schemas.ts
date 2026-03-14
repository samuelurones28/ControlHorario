import { z } from 'zod';

export const registerCompanySchema = z.object({
  companyName: z.string().min(2),
  cif: z.string().min(8),
  address: z.string().optional(),
  adminName: z.string().min(2),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(8)
});

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const employeeLoginSchema = z.object({
  companyCode: z.string().min(1),
  identifier: z.string().min(1),
  pin: z.string().length(6)
});
