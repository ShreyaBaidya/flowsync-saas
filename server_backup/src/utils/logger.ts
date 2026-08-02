/**
 * logger.ts
 * Winston-based structured logger.
 *
 * Development: colourised, human-readable console output
 * Production:  JSON lines suitable for log aggregators (Datadog, Logtail, etc.)
 */

import winston from 'winston';
import { env } from '../config/env';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// ── Development format ───────────────────────────────────────
const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length
      ? `\n  ${JSON.stringify(meta, null, 2)}`
      : '';
    return `${ts} [${level}] ${stack ?? message}${metaStr}`;
  }),
);

// ── Production format ────────────────────────────────────────
const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json(),
);

export const logger = winston.createLogger({
  level:      env.LOG_LEVEL,
  format:     env.isDev ? devFormat : prodFormat,
  transports: [
    new winston.transports.Console(),
  ],
  // Don't exit on uncaught exceptions — we handle those separately
  exitOnError: false,
});

// ── HTTP request logger (used by Morgan) ─────────────────────
export const httpLogStream = {
  write: (message: string): void => {
    // Morgan appends a newline — trim it before logging
    logger.http(message.trimEnd());
  },
};
