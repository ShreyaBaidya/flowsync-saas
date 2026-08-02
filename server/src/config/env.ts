import 'dotenv/config';
import { z } from 'zod';

// ── Schema ────────────────────────────────────────────────────
const envSchema = z.object({
  PORT: z
    .string()
    .default('5000')
    .transform(Number)
    .refine((n) => Number.isInteger(n) && n > 0 && n < 65536, {
      message: 'PORT must be a valid port number (1–65535)',
    }),

  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  
  MONGODB_URI: z
    .string({ required_error: 'MONGODB_URI is required' })
    .min(1, 'MONGODB_URI cannot be empty')
    .startsWith('mongodb', 'MONGODB_URI must start with "mongodb"'),

  ACCESS_TOKEN_SECRET: z
    .string({ required_error: 'ACCESS_TOKEN_SECRET is required' })
    .min(32, 'ACCESS_TOKEN_SECRET must be at least 32 characters'),

  REFRESH_TOKEN_SECRET: z
    .string({ required_error: 'REFRESH_TOKEN_SECRET is required' })
    .min(32, 'REFRESH_TOKEN_SECRET must be at least 32 characters'),

  ACCESS_TOKEN_EXPIRES_IN: z
    .string()
    .default('15m')
    .refine((v) => /^\d+[smhd]$/.test(v), {
      message: 'ACCESS_TOKEN_EXPIRES_IN must be a duration string (e.g. 15m, 1h)',
    }),

  REFRESH_TOKEN_EXPIRES_IN: z
    .string()
    .default('7d')
    .refine((v) => /^\d+[smhd]$/.test(v), {
      message: 'REFRESH_TOKEN_EXPIRES_IN must be a duration string (e.g. 7d, 30d)',
    }),

  CLIENT_URL: z
    .string({ required_error: 'CLIENT_URL is required' })
    .url('CLIENT_URL must be a valid URL'),

  COOKIE_SECURE: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),

  COOKIE_SAME_SITE: z
    .enum(['strict', 'lax', 'none'], {
      errorMap: () => ({
        message: 'COOKIE_SAME_SITE must be one of: strict | lax | none',
      }),
    })
    .default('lax'),
});

// ── Validation ────────────────────────────────────────────────
const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error('\n❌ Invalid environment variables:\n');
  result.error.issues.forEach((issue) => {
    console.error(`  ${issue.path.join('.')} — ${issue.message}`);
  });
  console.error('\nFix the above variables in your .env file and restart.\n');
  process.exit(1);
}

// ── Typed export ──────────────────────────────────────────────
export const env = result.data;
export type Env = typeof env;
