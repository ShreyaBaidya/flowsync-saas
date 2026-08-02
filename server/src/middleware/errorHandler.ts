import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { ZodError } from 'zod';
import { JsonWebTokenError, TokenExpiredError, NotBeforeError } from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError';
import { env } from '../config/env';

// ── Error response shape ──────────────────────────────────────

interface ErrorResponse {
  success: false;
  message: string;
  errors?: string[];
  stack?:  string;    // only included in development
}

// ── MongoDB duplicate key error type ─────────────────────────

interface MongoServerError {
  code:      number;
  keyValue?: Record<string, unknown>;
}

// ── Normalise any thrown value into an ApiError ───────────────

function normalise(err: unknown): ApiError {

  // ── Already an ApiError ───────────────────────────────────
  if (err instanceof ApiError) {
    return err;
  }

  // ── Zod validation error ──────────────────────────────────
  if (err instanceof ZodError) {
    const messages = err.issues.map(
      (i) => `${i.path.join('.')}: ${i.message}`,
    );
    return new ApiError(400, messages.join(', '));
  }

  // ── Mongoose ValidationError ──────────────────────────────
  if (err instanceof mongoose.Error.ValidationError) {
    const messages = Object.values(err.errors).map((e) => e.message);
    return new ApiError(400, messages.join(', '));
  }

  // ── Mongoose CastError (invalid ObjectId, type mismatch) ──
  if (err instanceof mongoose.Error.CastError) {
    return new ApiError(400, `Invalid value for field '${err.path}'`);
  }

  // ── MongoDB duplicate key (E11000) ────────────────────────
  if (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as MongoServerError).code === 11000
  ) {
    const mongo      = err as MongoServerError;
    const field      = mongo.keyValue
      ? Object.keys(mongo.keyValue)[0]
      : 'field';
    const value      = mongo.keyValue?.[field ?? ''];
    const fieldLabel = field ?? 'field';
    const valueLabel = value !== undefined ? ` '${String(value)}'` : '';
    return new ApiError(
      409,
      `${fieldLabel}${valueLabel} already exists`,
    );
  }

  // ── JWT errors ────────────────────────────────────────────
  if (err instanceof TokenExpiredError) {
    return new ApiError(401, 'Token has expired');
  }
  if (err instanceof JsonWebTokenError) {
    return new ApiError(401, 'Invalid token');
  }
  if (err instanceof NotBeforeError) {
    return new ApiError(401, 'Token not yet valid');
  }

  // ── SyntaxError from body-parser (malformed JSON) ─────────
  if (
    err instanceof SyntaxError &&
    'status' in err &&
    (err as SyntaxError & { status: number }).status === 400
  ) {
    return new ApiError(400, 'Malformed JSON in request body');
  }

  // ── Unknown / programming error ───────────────────────────
  const message =
    err instanceof Error ? err.message : 'An unexpected error occurred';

  return new ApiError(
    500,
    // Never expose internal error details in production
    env.NODE_ENV === 'production' ? 'An unexpected error occurred' : message,
    false,  // isOperational = false → signals a programming error
  );
}

// ── Global error handler ──────────────────────────────────────

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // Express requires the 4-argument signature for error middleware
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  const apiError = normalise(err);

  // Log unexpected (non-operational) errors and 5xx operational errors
  if (!apiError.isOperational || apiError.statusCode >= 500) {
    console.error(
      `[ERROR] ${req.method} ${req.originalUrl} — ${apiError.statusCode} — ${apiError.message}`,
      env.NODE_ENV !== 'production' ? apiError.stack : '',
    );
  }

  const body: ErrorResponse = {
    success: false,
    message: apiError.message,
  };

  // Include field-level errors for validation failures (400)
  if (
    err instanceof ZodError ||
    err instanceof mongoose.Error.ValidationError
  ) {
    body.errors =
      err instanceof ZodError
        ? err.issues.map((i) => `${i.path.join('.')}: ${i.message}`)
        : Object.values(err.errors).map((e) => e.message);
  }

  // Include stack trace in development only
  if (env.NODE_ENV !== 'production') {
    if (apiError.stack) {
      body.stack = apiError.stack;
    }
  }

  res.status(apiError.statusCode).json(body);
}
