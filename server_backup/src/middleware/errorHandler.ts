/**
 * errorHandler.ts
 * Global Express error-handling middleware.
 * Must be the LAST middleware registered on the app.
 *
 * Handles:
 *   - ApiError instances (operational errors — known, safe to expose)
 *   - Mongoose ValidationError
 *   - Mongoose CastError  (invalid ObjectId format)
 *   - Mongoose duplicate key error (code 11000)
 *   - Generic / unexpected errors (500, detail hidden in production)
 */

import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError';
import { ErrorPayload } from '../utils/ApiResponse';
import { logger } from '../utils/logger';
import { env } from '../config/env';

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  // ── 1. Normalise to ApiError ──────────────────────────────

  let apiError: ApiError;

  if (err instanceof ApiError) {
    apiError = err;

  } else if (err instanceof mongoose.Error.ValidationError) {
    // Mongoose schema validation failure
    const errors = Object.values(err.errors).map((e) => ({
      field:   e.path,
      message: e.message,
    }));
    apiError = ApiError.badRequest('Validation failed', errors);

  } else if (err instanceof mongoose.Error.CastError) {
    // Invalid ObjectId or type cast (e.g. "abc" where an ObjectId is expected)
    apiError = ApiError.badRequest(`Invalid value for field '${err.path}'`);

  } else if (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: unknown }).code === 11000
  ) {
    // MongoDB duplicate key error
    const field = extractDuplicateKeyField(err as MongoServerError);
    apiError = ApiError.conflict(
      field ? `${field} already exists` : 'Duplicate key error',
    );

  } else if (err instanceof SyntaxError && 'body' in err) {
    // Malformed JSON body
    apiError = ApiError.badRequest('Malformed JSON in request body');

  } else {
    // Unknown / programming error — do not leak details in production
    const originalMessage =
      err instanceof Error ? err.message : String(err);

    apiError = new ApiError(
      500,
      env.isProd ? 'An unexpected error occurred' : originalMessage,
      undefined,
      false,
    );
  }

  // ── 2. Log ────────────────────────────────────────────────

  const requestId = req.headers['x-request-id'] as string | undefined;
  const context   = {
    statusCode: apiError.statusCode,
    message:    apiError.message,
    method:     req.method,
    url:        req.originalUrl,
    ...(requestId && { requestId }),
  };

  if (apiError.statusCode >= 500) {
    logger.error('[ErrorHandler]', { ...context, stack: apiError.stack });
  } else {
    logger.warn('[ErrorHandler]', context);
  }

  // ── 3. Send response ──────────────────────────────────────

  const body: ErrorPayload = {
    success: false,
    error:   apiError.message,
    ...(apiError.errors && { errors: apiError.errors }),
  };

  res.status(apiError.statusCode).json(body);
}

// ── Helpers ──────────────────────────────────────────────────

interface MongoServerError {
  code: number;
  keyValue?: Record<string, unknown>;
}

function extractDuplicateKeyField(err: MongoServerError): string | null {
  if (err.keyValue) {
    const keys = Object.keys(err.keyValue);
    return keys[0] ?? null;
  }
  return null;
}
