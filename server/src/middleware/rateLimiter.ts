/**
 * rateLimiter.ts
 * Express-rate-limit configurations.
 * Separate limiters allow different windows for different route groups.
 */

import rateLimit from 'express-rate-limit';
import { ApiError } from '../utils/ApiError';

/** General limiter applied to all API routes */
export const generalLimiter = rateLimit({
  windowMs:         15 * 60 * 1000, // 15 minutes
  max:              200,
  standardHeaders:  true,
  legacyHeaders:    false,
  // Skip health checks — they must not be throttled by monitoring systems
  skip: (req) => req.path === '/health' || req.path.endsWith('/health'),
  handler: (_req, _res, next) => {
    next(ApiError.tooManyRequests('Too many requests, please try again later.'));
  },
});

/** Stricter limiter for auth routes (signup, signin, forgot-password) */
export const authLimiter = rateLimit({
  windowMs:         15 * 60 * 1000, // 15 minutes
  max:              20,
  standardHeaders:  true,
  legacyHeaders:    false,
  handler: (_req, _res, next) => {
    next(ApiError.tooManyRequests('Too many authentication attempts, please try again in 15 minutes.'));
  },
});
