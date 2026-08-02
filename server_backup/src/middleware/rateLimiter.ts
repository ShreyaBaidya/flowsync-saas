/**
 * rateLimiter.ts
 * Express-rate-limit configurations.
 */

import rateLimit from 'express-rate-limit';
import { ApiError } from '../utils/ApiError';
import { env } from '../config/env';


/** General limiter applied to all API routes */
export const generalLimiter = env.isDev
  ? (_req, _res, next) => next()
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 200,
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => req.path === '/health' || req.path.endsWith('/health'),
      handler: (_req, _res, next) => {
        next(ApiError.tooManyRequests('Too many requests, please try again later.'));
      },
    });

/** Stricter limiter for auth routes */
export const authLimiter = env.isDev
  ? (_req, _res, next) => next()
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 20,
      standardHeaders: true,
      legacyHeaders: false,
      handler: (_req, _res, next) => {
        next(
          ApiError.tooManyRequests(
            'Too many authentication attempts, please try again in 15 minutes.'
          )
        );
      },
    });