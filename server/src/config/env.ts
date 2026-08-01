/**
 * env.ts
 * Centralised, validated environment configuration.
 * Fails fast at startup if a required variable is missing.
 */

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`[Config] Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalEnv(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

function requireInt(name: string, fallback?: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === '') {
    if (fallback !== undefined) return fallback;
    throw new Error(`[Config] Missing required environment variable: ${name}`);
  }
  const parsed = parseInt(raw, 10);
  if (isNaN(parsed)) {
    throw new Error(`[Config] Environment variable ${name} must be an integer, got: "${raw}"`);
  }
  return parsed;
}

export const env = {
  // ── Server ────────────────────────────────────────────────
  NODE_ENV:   optionalEnv('NODE_ENV', 'development'),
  PORT:       requireInt('PORT', 5000),
  API_PREFIX: optionalEnv('API_PREFIX', '/api/v1'),

  // ── Database ──────────────────────────────────────────────
  MONGODB_URI: requireEnv('MONGODB_URI'),

  // ── CORS ──────────────────────────────────────────────────
  CORS_ORIGINS: optionalEnv('CORS_ORIGINS', 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),

  // ── JWT ───────────────────────────────────────────────────
  JWT_ACCESS_SECRET:  requireEnv('JWT_ACCESS_SECRET'),
  JWT_REFRESH_SECRET: requireEnv('JWT_REFRESH_SECRET'),

  // Short-lived access token (15 minutes)
  JWT_ACCESS_EXPIRES_IN:  optionalEnv('JWT_ACCESS_EXPIRES_IN',  '15m'),
  // Long-lived refresh token (7 days)
  JWT_REFRESH_EXPIRES_IN: optionalEnv('JWT_REFRESH_EXPIRES_IN', '7d'),

  // ── Cookies ───────────────────────────────────────────────
  // Refresh token cookie max-age in milliseconds (7 days)
  COOKIE_MAX_AGE: requireInt('COOKIE_MAX_AGE', 7 * 24 * 60 * 60 * 1000),

  // ── Bcrypt ───────────────────────────────────────────────
  BCRYPT_ROUNDS: requireInt('BCRYPT_ROUNDS', 12),

  // ── Logging ───────────────────────────────────────────────
  LOG_LEVEL: optionalEnv('LOG_LEVEL', 'info'),

  // ── Flags ─────────────────────────────────────────────────
  get isDev()  { return this.NODE_ENV === 'development'; },
  get isProd() { return this.NODE_ENV === 'production';  },
} as const;
