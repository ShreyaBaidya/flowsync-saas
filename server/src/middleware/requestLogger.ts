/**
 * requestLogger.ts
 * Morgan HTTP request logger middleware.
 * Attaches a unique X-Request-ID to every request for log correlation.
 */

import morgan, { StreamOptions } from 'morgan';
import { Request, Response } from 'express';
import crypto from 'crypto';
import { httpLogStream } from '../utils/logger';
import { env } from '../config/env';

// ── Request ID token ──────────────────────────────────────────
// Assign a unique ID to every inbound request so individual requests
// can be traced across log lines and correlated with error reports.
morgan.token('request-id', (req: Request, res: Response): string => {
  if (!req.headers['x-request-id']) {
    req.headers['x-request-id'] = crypto.randomUUID();
  }
  // Echo the ID back in the response header for client-side correlation
  res.setHeader('X-Request-ID', req.headers['x-request-id'] as string);
  return req.headers['x-request-id'] as string;
});

// Development: compact, human-readable
const devFormat  = ':request-id :method :url :status :res[content-length] - :response-time ms';
// Production: full structured line suitable for log aggregators
const prodFormat =
  ':request-id :remote-addr - :method :url HTTP/:http-version :status :res[content-length] :response-time ms';

export const requestLogger = morgan(
  env.isDev ? devFormat : prodFormat,
  { stream: httpLogStream as StreamOptions },
);
