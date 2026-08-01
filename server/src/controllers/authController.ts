/**
 * authController.ts
 * Thin HTTP layer — validates inputs, calls authService, sends responses.
 * All business logic lives in authService.ts.
 *
 * Routes handled:
 *   POST   /auth/signup    — create account
 *   POST   /auth/signin    — authenticate and get tokens
 *   POST   /auth/signout   — revoke refresh token (current device)
 *   POST   /auth/refresh   — exchange refresh token for new access token
 *   GET    /auth/me        — return current user from access token
 */

import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/authService';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { refreshCookieOptions } from '../utils/token';
import { SignUpBody, SignInBody } from '../types/auth.types';

const REFRESH_COOKIE = 'fs_refresh';   // Cookie name

// ── POST /auth/signup ─────────────────────────────────────────

export async function signUp(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { name, email, password, plan }: SignUpBody = req.body;

    // Basic presence checks — detailed validation is in the service / model
    if (!name?.trim())  throw ApiError.badRequest('Name is required.');
    if (!email?.trim()) throw ApiError.badRequest('Email is required.');
    if (!password)      throw ApiError.badRequest('Password is required.');
    if (password.length < 8) {
      throw ApiError.badRequest('Password must be at least 8 characters.');
    }

    const result = await authService.register({ name, email, password, plan });

    // Set httpOnly refresh token cookie
    res.cookie(REFRESH_COOKIE, result.refreshToken, refreshCookieOptions());

    ApiResponse.created(
      res,
      { user: result.user, accessToken: result.accessToken },
      'Account created successfully.',
    );
  } catch (err) {
    next(err);
  }
}

// ── POST /auth/signin ─────────────────────────────────────────

export async function signIn(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { email, password }: SignInBody = req.body;

    if (!email?.trim()) throw ApiError.badRequest('Email is required.');
    if (!password)      throw ApiError.badRequest('Password is required.');

    const result = await authService.login({ email, password });

    res.cookie(REFRESH_COOKIE, result.refreshToken, refreshCookieOptions());

    ApiResponse.success(
      res,
      { user: result.user, accessToken: result.accessToken },
      'Signed in successfully.',
    );
  } catch (err) {
    next(err);
  }
}

// ── POST /auth/signout ────────────────────────────────────────

export async function signOut(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;

    if (token) {
      await authService.logout(token);
    }

    // Clear the cookie regardless
    res.clearCookie(REFRESH_COOKIE, {
      ...refreshCookieOptions(0),
      maxAge: 0,
    });

    ApiResponse.success(res, null, 'Signed out successfully.');
  } catch (err) {
    next(err);
  }
}

// ── POST /auth/refresh ────────────────────────────────────────

export async function refreshTokens(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;

    if (!token) {
      throw ApiError.unauthorized('No refresh token provided.');
    }

    const result = await authService.refresh(token);

    // Rotate: set the new refresh token cookie
    res.cookie(REFRESH_COOKIE, result.refreshToken, refreshCookieOptions());

    ApiResponse.success(
      res,
      { user: result.user, accessToken: result.accessToken },
      'Tokens refreshed.',
    );
  } catch (err) {
    next(err);
  }
}

// ── GET /auth/me ──────────────────────────────────────────────

export async function getMe(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // req.user is populated by the authenticate middleware
    if (!req.user) {
      throw ApiError.unauthorized('Not authenticated.');
    }

    const user = await authService.getMe(req.user.sub);
    ApiResponse.success(res, { user });
  } catch (err) {
    next(err);
  }
}
