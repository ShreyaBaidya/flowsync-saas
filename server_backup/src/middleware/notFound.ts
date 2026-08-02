/**
 * notFound.ts
 * Catches every request that didn't match any registered route
 * and forwards a 404 ApiError to the global error handler.
 */

import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';

export function notFound(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}
