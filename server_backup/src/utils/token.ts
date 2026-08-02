/**
 * token.ts
 * JWT + refresh token utilities.
 *
 * Access token:   signed JWT, verified in-memory, short-lived (15m)
 * Refresh token:  opaque random string stored in DB + httpOnly cookie, 7d
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Types } from 'mongoose';
import { env } from '../config/env';
import { AccessTokenPayload, RefreshTokenPayload, UserPlan } from '../types/auth.types';

// ── Access token ──────────────────────────────────────────────

export function signAccessToken(payload: {
  sub:   string;
  email: string;
  name:  string;
  plan:  UserPlan;
}): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    issuer:    'flowsync',
    audience:  'flowsync-client',
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET, {
    issuer:   'flowsync',
    audience: 'flowsync-client',
  }) as AccessTokenPayload;
}

// ── Refresh token ────────────────────────────────────────────

/**
 * Generate a cryptographically secure opaque refresh token string.
 * This is what goes in the cookie and the database — not a JWT.
 */
export function generateRefreshTokenString(): string {
  return crypto.randomBytes(64).toString('hex');
}

/**
 * Sign a JWT that encodes the refresh token metadata.
 * Stored alongside the opaque string in the DB for payload lookup.
 */
export function signRefreshTokenJwt(payload: {
  sub:     string;
  tokenId: string;
}): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    issuer:    'flowsync',
    audience:  'flowsync-refresh',
  });
}

export function verifyRefreshTokenJwt(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET, {
    issuer:   'flowsync',
    audience: 'flowsync-refresh',
  }) as RefreshTokenPayload;
}

// ── Cookie helpers ────────────────────────────────────────────

/** Standard httpOnly cookie options for the refresh token */
export function refreshCookieOptions(maxAge?: number): {
  httpOnly: boolean;
  secure:   boolean;
  sameSite: 'strict' | 'lax' | 'none';
  maxAge:   number;
  path:     string;
} {
  return {
    httpOnly: true,
    secure:   env.isProd,          // HTTPS only in production
    sameSite: env.isProd ? 'strict' : 'lax',
    maxAge:   maxAge ?? env.COOKIE_MAX_AGE,
    path:     '/api/v1/auth',      // Scope cookie to auth routes only
  };
}

/** Calculate expiry Date from a duration string like "7d" or "15m" */
export function expiryFromDuration(duration: string): Date {
  const unit  = duration.slice(-1);
  const value = parseInt(duration.slice(0, -1), 10);

  const ms: Record<string, number> = {
    s: 1_000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };

  return new Date(Date.now() + value * (ms[unit] ?? ms['d']));
}

// ── ObjectId helper ───────────────────────────────────────────

export function toObjectId(id: string): Types.ObjectId {
  return new Types.ObjectId(id);
}
