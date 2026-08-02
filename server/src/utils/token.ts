import jwt from 'jsonwebtoken';
import { CookieOptions } from 'express';
import { env } from '../config/env';
import type { UserRole, UserPlan } from '../types/user.types';

// ── Payload shapes ────────────────────────────────────────────

export interface AccessTokenPayload {
  sub:  string;
  email: string;
  role: UserRole;
  plan: UserPlan;
}

export interface RefreshTokenPayload {
  sub:          string;
  tokenVersion: number;
}

// ── Input accepted by both generate functions ─────────────────

export interface TokenUser {
  id:           string;
  email:        string;
  role:         UserRole;
  plan:         UserPlan;
  tokenVersion: number;
}

// ── Duration string → milliseconds ───────────────────────────
// Used to set cookie maxAge from the same expiry string as the JWT.

function durationToMs(duration: string): number {
  const unit  = duration.slice(-1);
  const value = parseInt(duration.slice(0, -1), 10);

  const map: Record<string, number> = {
    s: 1_000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };

  const factor = map[unit];
  if (factor === undefined) {
    throw new Error(`Invalid duration unit "${unit}" in "${duration}"`);
  }

  return value * factor;
}

// ── Generate ──────────────────────────────────────────────────

export function generateAccessToken(user: TokenUser): string {
  const payload: AccessTokenPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    plan: user.plan,
  };

  return jwt.sign(payload, env.ACCESS_TOKEN_SECRET, {
    expiresIn: env.ACCESS_TOKEN_EXPIRES_IN,
  });
}

export function generateRefreshToken(user: TokenUser): string {
  const payload: RefreshTokenPayload = {
    sub: user.id,
    tokenVersion: user.tokenVersion,
  };

  return jwt.sign(payload, env.REFRESH_TOKEN_SECRET, {
    expiresIn: env.REFRESH_TOKEN_EXPIRES_IN,
  });
}

// ── Verify ────────────────────────────────────────────────────

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    return jwt.verify(token, env.ACCESS_TOKEN_SECRET) as AccessTokenPayload;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new Error('Access token has expired');
    }
    if (err instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid access token');
    }
    throw new Error('Access token verification failed');
  }
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  try {
    return jwt.verify(token, env.REFRESH_TOKEN_SECRET) as RefreshTokenPayload;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token has expired');
    }
    if (err instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid refresh token');
    }
    throw new Error('Refresh token verification failed');
  }
}

// ── Cookie options ────────────────────────────────────────────

export function refreshCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure:   env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAME_SITE,
    path:     '/api/v1/auth', // scope cookie to auth routes only
    maxAge:   durationToMs(env.REFRESH_TOKEN_EXPIRES_IN),
  };
}

export function clearCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure:   env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAME_SITE,
    path:     '/api/v1/auth',
  };
}
