/**
 * requestLogger.ts
 * Morgan HTTP request logger middleware.
 */

import morgan, { StreamOptions } from 'morgan';
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { httpLogStream } from '../utils/logger';
import { env } from '../config/env';

/**
 * Assign a unique request ID before the request reaches Morgan.
 */
export const attachRequestId = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const requestId =
    (req.headers['x-request-id'] as string) ?? crypto.randomUUID();

  req.headers['x-request-id'] = requestId;

  // Safe because this runs before the response is sent
  res.setHeader('X-Request-ID', requestId);

  next();
};

morgan.token('request-id', (req: Request) => {
  return req.headers['x-request-id'] as string;
});

const devFormat =
  ':request-id :method :url :status :res[content-length] - :response-time ms';

const prodFormat =
  ':request-id :remote-addr - :method :url HTTP/:http-version :status :res[content-length] :response-time ms';

export const requestLogger = morgan(
  env.isDev ? devFormat : prodFormat,
  {
    stream: httpLogStream as StreamOptions,
  },
);