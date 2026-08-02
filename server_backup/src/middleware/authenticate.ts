/**
 * authenticate.ts
 * Express middleware that verifies the JWT access token on protected routes.
 *
 * Expects: Authorization: Bearer <accessToken>
 *
 * On success:  populates req.user with the decoded payload and calls next()
 * On failure:  forwards a 401 ApiError to the global error handler
 *
 * Usage:
 *   router.get('/protected', authenticate, myController);
 */

import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/token';
import { ApiError } from '../utils/ApiError';
import { AccessTokenPayload } from '../types/auth.types';
import { Types } from 'mongoose';

export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  try {
    // ── Extract token from Authorization header ───────────────
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized(
        'Access token missing. Include "Authorization: Bearer <token>" header.',
      );
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw ApiError.unauthorized('Access token is empty.');
    }

    // ── Verify and decode ─────────────────────────────────────
    const payload: AccessTokenPayload = verifyAccessToken(token);

    // Attach to request for downstream handlers
    req.user = {
      ...payload,
      _id: new Types.ObjectId(payload.sub),
    };

    next();
  } catch (err) {
    // jwt.verify throws JsonWebTokenError / TokenExpiredError
    if (
      err instanceof Error &&
      (err.name === 'JsonWebTokenError' ||
       err.name === 'TokenExpiredError' ||
       err.name === 'NotBeforeError')
    ) {
      next(
        ApiError.unauthorized(
          err.name === 'TokenExpiredError'
            ? 'Access token has expired. Please refresh your session.'
            : 'Invalid access token.',
        ),
      );
    } else {
      next(err);
    }
  }
}
