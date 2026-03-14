import { z } from 'zod';
import * as dotenv from 'dotenv';
dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(10),
  JWT_REFRESH_SECRET: z.string().min(10),
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().url(),
});

const envVars = envSchema.safeParse(process.env);

if (!envVars.success) {
  console.error('Invalid environment variables:', envVars.error.format());
  process.exit(1);
}

export const config = envVars.data;
