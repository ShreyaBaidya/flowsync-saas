import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/authService';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { refreshCookieOptions, clearCookieOptions } from '../utils/token';

// ── Cookie name ───────────────────────────────────────────────
// Defined once here so it stays in sync between set and clear.
const REFRESH_COOKIE = 'refreshToken';

// ── Helpers ───────────────────────────────────────────────────

function getRequestContext(req: Request): authService.RequestContext {
  return {
    userAgent: req.headers['user-agent'] ?? 'unknown',
    ipAddress: req.ip ?? 'unknown',
  };
}

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE, token, refreshCookieOptions());
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE, clearCookieOptions());
}

// ── signup ────────────────────────────────────────────────────

export async function signup(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { name, email, password } = req.body as {
      name: string;
      email: string;
      password: string;
    };

    const ctx    = getRequestContext(req);
    const result = await authService.register({ name, email, password }, ctx);

    setRefreshCookie(res, result.refreshToken);

    ApiResponse.created(res, 'Account created successfully', {
      user:        result.user,
      accessToken: result.accessToken,
      // refreshToken is intentionally omitted — it lives in the httpOnly cookie
    });
  } catch (err) {
    next(err);
  }
}

// ── signin ────────────────────────────────────────────────────

export async function signin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { email, password } = req.body as {
      email: string;
      password: string;
    };

    const ctx    = getRequestContext(req);
    const result = await authService.login({ email, password }, ctx);

    setRefreshCookie(res, result.refreshToken);

    ApiResponse.success(res, 'Signed in successfully', {
      user:        result.user,
      accessToken: result.accessToken,
    });
  } catch (err) {
    next(err);
  }
}

// ── refresh ───────────────────────────────────────────────────

export async function refresh(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const rawToken = req.cookies[REFRESH_COOKIE] as string | undefined;

    if (!rawToken) {
      throw ApiError.unauthorized('Refresh token cookie is missing');
    }

    const ctx    = getRequestContext(req);
    const result = await authService.refresh(rawToken, ctx);

    // Rotate: replace the old cookie with the new refresh token
    setRefreshCookie(res, result.refreshToken);

    ApiResponse.success(res, 'Token refreshed successfully', {
      user:        result.user,
      accessToken: result.accessToken,
    });
  } catch (err) {
    next(err);
  }
}

// ── logout ────────────────────────────────────────────────────

export async function logout(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const rawToken = req.cookies[REFRESH_COOKIE] as string | undefined;

    if (rawToken) {
      // Revoke the current session token from the database
      await authService.logout(rawToken);
    }

    clearRefreshCookie(res);

    ApiResponse.success(res, 'Logged out successfully', null);
  } catch (err) {
    next(err);
  }
}

// ── logoutAll ─────────────────────────────────────────────────

export async function logoutAll(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // req.user is set by the authenticate middleware
    if (!req.user) {
      throw ApiError.unauthorized('Not authenticated');
    }

    await authService.logoutAll(req.user.id);

    clearRefreshCookie(res);

    ApiResponse.success(res, 'Logged out from all devices', null);
  } catch (err) {
    next(err);
  }
}

// ── getMe ─────────────────────────────────────────────────────

export async function getMe(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw ApiError.unauthorized('Not authenticated');
    }

    const user = await authService.getMe(req.user.id);

    ApiResponse.success(res, 'User retrieved successfully', { user });
  } catch (err) {
    next(err);
  }
}
