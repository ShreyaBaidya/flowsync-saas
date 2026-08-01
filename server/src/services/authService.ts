/**
 * authService.ts
 * Pure business logic for authentication.
 * Controllers call these functions — no Express types here.
 *
 * Responsibilities:
 *  - Register a new user
 *  - Authenticate credentials and issue tokens
 *  - Rotate refresh tokens
 *  - Revoke a single refresh token (logout)
 *  - Revoke all tokens for a user (sign out all devices)
 */

import { User, IUser } from '../models/User';
import { RefreshToken } from '../models/RefreshToken';
import { ApiError } from '../utils/ApiError';
import {
  signAccessToken,
  generateRefreshTokenString,
  expiryFromDuration,
} from '../utils/token';
import { env } from '../config/env';
import { SignUpBody, SignInBody, SafeUser, UserPlan } from '../types/auth.types';

// ── Returned by signUp and signIn ─────────────────────────────

export interface AuthResult {
  user:         SafeUser;
  accessToken:  string;
  refreshToken: string;   // opaque string → goes in cookie
}

// ── Register ─────────────────────────────────────────────────

export async function register(body: SignUpBody): Promise<AuthResult> {
  const { name, email, password, plan = 'starter' } = body;

  // 1. Prevent duplicate accounts
  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    throw ApiError.conflict('An account with this email already exists.');
  }

  // 2. Create user — the pre-save hook hashes passwordHash
  const user = new User({
    name:         name.trim(),
    email:        email.toLowerCase().trim(),
    passwordHash: password,   // Hook replaces this with bcrypt hash
    plan,
    ...(plan === 'pro_trial' && { trialStartedAt: new Date() }),
  });

  await user.save();

  // 3. Issue tokens
  return issueTokens(user);
}

// ── Login ────────────────────────────────────────────────────

export async function login(body: SignInBody): Promise<AuthResult> {
  const { email, password } = body;

  // 1. Find user — explicitly select passwordHash (excluded by default)
  const user = await User.findOne({
    email: email.toLowerCase().trim(),
  }).select('+passwordHash');

  // Use constant-time comparison even for "not found" to prevent timing attacks
  if (!user) {
    await simulateHashDelay();
    throw ApiError.unauthorized('Invalid email or password.');
  }

  // 2. Verify password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw ApiError.unauthorized('Invalid email or password.');
  }

  // 3. Issue tokens
  return issueTokens(user);
}

// ── Refresh ───────────────────────────────────────────────────

export async function refresh(cookieToken: string): Promise<AuthResult> {
  // 1. Find the stored token record (validates existence + not revoked)
  const stored = await RefreshToken.findOne({
    token:     cookieToken,
    isRevoked: false,
  });

  if (!stored) {
    throw ApiError.unauthorized('Invalid or expired refresh token.');
  }

  // 2. Check expiry (belt-and-suspenders; TTL index handles cleanup)
  if (stored.expiresAt < new Date()) {
    await stored.deleteOne();
    throw ApiError.unauthorized('Refresh token has expired. Please sign in again.');
  }

  // 3. Load user
  const user = await User.findById(stored.userId);
  if (!user) {
    await stored.deleteOne();
    throw ApiError.unauthorized('User not found.');
  }

  // 4. Revoke the used token (rotation — a token can only be used once)
  await stored.deleteOne();

  // 5. Issue fresh tokens
  return issueTokens(user);
}

// ── Logout (single device) ────────────────────────────────────

export async function logout(cookieToken: string): Promise<void> {
  // Silently succeeds even if token is not found (already expired or revoked)
  await RefreshToken.deleteOne({ token: cookieToken });
}

// ── Logout all devices ────────────────────────────────────────

export async function logoutAll(userId: string): Promise<void> {
  await RefreshToken.deleteMany({ userId });
}

// ── Get current user (for /auth/me) ──────────────────────────

export async function getMe(userId: string): Promise<SafeUser> {
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound('User not found.');
  }
  return user.toSafeObject();
}

// ── Helpers ───────────────────────────────────────────────────

/**
 * Create access token + refresh token pair and persist the refresh token.
 */
async function issueTokens(user: IUser): Promise<AuthResult> {
  // Access token (JWT)
  const accessToken = signAccessToken({
    sub:   (user._id as { toString(): string }).toString(),
    email: user.email,
    name:  user.name,
    plan:  user.plan as UserPlan,
  });

  // Refresh token — opaque random string stored in DB
  const rawToken    = generateRefreshTokenString();
  const expiresAt   = expiryFromDuration(env.JWT_REFRESH_EXPIRES_IN);

  await RefreshToken.create({
    userId:    user._id,
    token:     rawToken,
    expiresAt,
  });

  return {
    user:         user.toSafeObject(),
    accessToken,
    refreshToken: rawToken,
  };
}

/**
 * Spend ~100ms to resist timing attacks on the "user not found" path.
 * Without this, an attacker can detect which emails are registered
 * by measuring the response time difference.
 */
async function simulateHashDelay(): Promise<void> {
  const { default: bcrypt } = await import('bcryptjs');
  await bcrypt.compare('dummy', '$2b$12$dummyhashpadding000000000000000000000000000000000000000');
}
