import { User } from '../models/User';
import { RefreshToken } from '../models/RefreshToken';
import { ApiError } from '../utils/ApiError';
import { env } from '../config/env';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  type TokenUser,
} from '../utils/token';
import type { SafeUser } from '../types/user.types';

// ── Return shapes ─────────────────────────────────────────────

export interface AuthResult {
  user:         SafeUser;
  accessToken:  string;
  refreshToken: string;
}

export interface LogoutResult {
  success: boolean;
  message: string;
}

// ── Context passed in from controllers ───────────────────────
// Kept as a plain object — no Express types here.

export interface RequestContext {
  userAgent: string;
  ipAddress: string;
}

// ── Private helpers ───────────────────────────────────────────

/**
 * Parse a duration string (e.g. "7d", "15m") into a future Date.
 */
function parseDurationToDate(duration: string): Date {
  const unit  = duration.slice(-1);
  const value = parseInt(duration.slice(0, -1), 10);

  const msMap: Record<string, number> = {
    s: 1_000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };

  const factor = msMap[unit];
  if (!factor) throw new Error(`Invalid duration string: "${duration}"`);

  return new Date(Date.now() + value * factor);
}

/**
 * Build the minimal TokenUser required by the token utilities.
 */
function toTokenUser(user: InstanceType<typeof User>): TokenUser {
  return {
    id:           user._id.toString(),
    email:        user.email,
    role:         user.role,
    plan:         user.plan,
    tokenVersion: 0,
  };
}

/**
 * Generate an access + refresh token pair and persist the
 * hashed refresh token to the database.
 */
async function issueTokenPair(
  user: InstanceType<typeof User>,
  ctx: RequestContext,
): Promise<Pick<AuthResult, 'accessToken' | 'refreshToken'>> {
  const tokenUser    = toTokenUser(user);
  const accessToken  = generateAccessToken(tokenUser);
  const refreshToken = generateRefreshToken(tokenUser);

  await RefreshToken.create({
    user:        user._id,
    hashedToken: RefreshToken.hashToken(refreshToken),
    expiresAt:   parseDurationToDate(env.REFRESH_TOKEN_EXPIRES_IN),
    lastUsedAt:  new Date(),
    userAgent:   ctx.userAgent,
    ipAddress:   ctx.ipAddress,
  });

  return { accessToken, refreshToken };
}

// ── register() ───────────────────────────────────────────────

export interface RegisterInput {
  name:     string;
  email:    string;
  password: string;
}

export async function register(
  input: RegisterInput,
  ctx: RequestContext,
): Promise<AuthResult> {
  const { name, email, password } = input;

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    throw ApiError.conflict('An account with this email already exists');
  }

  // pre-save hook on User model hashes the password automatically
  const user = await User.create({ name: name.trim(), email, password });

  const { accessToken, refreshToken } = await issueTokenPair(user, ctx);

  return { user: user.toSafeObject(), accessToken, refreshToken };
}

// ── login() ──────────────────────────────────────────────────

export interface LoginInput {
  email:    string;
  password: string;
}

export async function login(
  input: LoginInput,
  ctx: RequestContext,
): Promise<AuthResult> {

  console.log("LOGIN INPUT:", input);

  const { email, password } = input;

  console.log("EMAIL:", email);
  console.log("PASSWORD:", password);

  // select: false on password field requires explicit opt-in
  const user = await User
    .findOne({ email: email.toLowerCase().trim() })
    .select('+password');

  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const { accessToken, refreshToken } = await issueTokenPair(user, ctx);

  return {
    user: user.toSafeObject(),
    accessToken,
    refreshToken,
  };
}

// ── refresh() ────────────────────────────────────────────────

export async function refresh(
  rawToken: string,
  ctx: RequestContext,
): Promise<AuthResult> {
  // 1. Verify the JWT signature and expiry
  const payload = verifyRefreshToken(rawToken);

  // 2. Look up the hashed token in the database
  const stored = await RefreshToken.findByRawToken(rawToken);
  if (!stored) {
    // Token not found — it may have been used already (replay attack)
    // or was manually revoked.  Invalidate all tokens for this user
    // as a precaution (refresh token reuse detection).
    await RefreshToken.deleteMany({ user: payload.sub });
    throw ApiError.unauthorized('Refresh token has been revoked');
  }

  // 3. Load the user
  const user = await User.findById(stored.user);
  if (!user) {
    await stored.deleteOne();
    throw ApiError.unauthorized('User not found');
  }

  // 4. Rotate — delete the consumed token before issuing a new one
  await stored.deleteOne();

  // 5. Issue a fresh pair and store the new hashed refresh token
  const { accessToken, refreshToken: newRefreshToken } = await issueTokenPair(
    user,
    ctx,
  );

  return { user: user.toSafeObject(), accessToken, refreshToken: newRefreshToken };
}

// ── logout() ─────────────────────────────────────────────────

export async function logout(rawToken: string): Promise<LogoutResult> {
  // Delete only the token belonging to this device/session
  const hashed = RefreshToken.hashToken(rawToken);
  await RefreshToken.deleteOne({ hashedToken: hashed });

  return { success: true, message: 'Logged out successfully' };
}

// ── logoutAll() ──────────────────────────────────────────────

export async function logoutAll(userId: string): Promise<LogoutResult> {
  // Remove every active session for this user across all devices
  await RefreshToken.deleteMany({ user: userId });

  return { success: true, message: 'Logged out from all devices' };
}

// ── getMe() ──────────────────────────────────────────────────

export async function getMe(userId: string): Promise<SafeUser> {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('User not found');

  return user.toSafeObject();
}
