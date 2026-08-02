/**
 * ApiError.ts
 * Custom error class for operational API errors.
 * All intentional errors (4xx, 5xx) should be thrown as ApiError instances
 * so the global error handler can format them consistently.
 */

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errors?: unknown[];

  constructor(
    statusCode: number,
    message: string,
    errors?: unknown[],
    isOperational = true,
  ) {
    super(message);
    this.name        = 'ApiError';
    this.statusCode  = statusCode;
    this.isOperational = isOperational;
    this.errors      = errors;

    // Maintains proper prototype chain in transpiled ES5
    Object.setPrototypeOf(this, ApiError.prototype);

    // Captures V8 stack trace, excluding this constructor frame
    Error.captureStackTrace(this, this.constructor);
  }

  // ── Convenience factories ───────────────────────────────────

  static badRequest(message = 'Bad request', errors?: unknown[]): ApiError {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = 'Unauthorized'): ApiError {
    return new ApiError(401, message);
  }

  static forbidden(message = 'Forbidden'): ApiError {
    return new ApiError(403, message);
  }

  static notFound(message = 'Resource not found'): ApiError {
    return new ApiError(404, message);
  }

  static conflict(message = 'Conflict'): ApiError {
    return new ApiError(409, message);
  }

  static tooManyRequests(message = 'Too many requests'): ApiError {
    return new ApiError(429, message);
  }

  static internal(message = 'Internal server error'): ApiError {
    return new ApiError(500, message, undefined, false);
  }
}
