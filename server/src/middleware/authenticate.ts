import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { ApiError } from '../utils/ApiError';
import { verifyAccessToken } from '../utils/token';
import type { UserRole } from '../types/user.types';

// ── authenticate ──────────────────────────────────────────────

/**
 * Verifies the Bearer access token from the Authorization header,
 * loads the user from the database, and attaches a safe user object
 * to req.user.  Never attaches the password field.
 */
export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // ── 1. Extract the Authorization header ──────────────────
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      throw ApiError.unauthorized(
        'Authorization header is missing',
      );
    }

    if (!authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized(
        'Authorization header must use the Bearer scheme',
      );
    }

    const token = authHeader.slice(7).trim(); // remove "Bearer "

    if (!token) {
      throw ApiError.unauthorized('Access token is missing');
    }

    // ── 2. Verify the JWT ────────────────────────────────────
    // verifyAccessToken throws descriptive Error instances on failure
    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch (err) {
      throw ApiError.unauthorized(
        err instanceof Error ? err.message : 'Invalid access token',
      );
    }

    // ── 3. Load the user from the database ───────────────────
    // We verify the user still exists and hasn't been deleted
    // since the token was issued.  password is excluded by default
    // (select: false on the schema).
    const user = await User.findById(payload.sub);

    if (!user) {
      throw ApiError.unauthorized(
        'The account associated with this token no longer exists',
      );
    }

    // ── 4. Future: isActive / isBanned check ─────────────────
    // When an isActive field is added to the User model, add:
    //
    //   if (!user.isActive) {
    //     throw ApiError.forbidden('This account has been suspended');
    //   }
    //
    // This stub keeps the guard location consistent so future
    // contributors know exactly where to add the check.

    // ── 5. Attach safe user to request ───────────────────────
    // toSafeObject() explicitly omits password and internal fields.
    req.user = user.toSafeObject();

    next();
  } catch (err) {
    next(err);
  }
}

// ── authorize ─────────────────────────────────────────────────

/**
 * Role-based access control middleware.
 * Must be used after authenticate() — relies on req.user being set.
 *
 * Usage:
 *   router.delete('/users/:id', authenticate, authorize('admin'), deleteUser);
 *   router.get('/dashboard',    authenticate, authorize('admin', 'user'), getDashboard);
 */
export function authorize(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      // authenticate() should always run first; this is a programming error
      return next(ApiError.unauthorized('Not authenticated'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Access denied. Required role: ${roles.join(' or ')}`,
        ),
      );
    }

    next();
  };
}
