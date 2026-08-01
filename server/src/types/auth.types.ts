/**
 * auth.types.ts
 * Shared TypeScript types for authentication.
 * Imported by models, services, controllers, and middleware.
 */

import { Types } from 'mongoose';

// ── JWT payload shapes ────────────────────────────────────────

export interface AccessTokenPayload {
  sub: string;        // User._id as string
  email: string;
  name: string;
  plan: UserPlan;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  sub:       string;  // User._id as string
  tokenId:   string;  // RefreshToken._id — used for rotation / revocation
  iat?: number;
  exp?: number;
}

// ── Plan enum ────────────────────────────────────────────────

export type UserPlan = 'starter' | 'pro_trial' | 'pro' | 'enterprise';

// ── Request body shapes ──────────────────────────────────────

export interface SignUpBody {
  name:     string;
  email:    string;
  password: string;
  plan?:    UserPlan;
}

export interface SignInBody {
  email:    string;
  password: string;
}

// ── Safe user shape (no passwordHash) returned to client ─────

export interface SafeUser {
  id:              string;
  name:            string;
  email:           string;
  initials:        string;
  plan:            UserPlan;
  trialStartedAt?: string;   // ISO string
  signedInAt:      string;   // ISO string
  createdAt:       string;   // ISO string
}

// ── Extend Express Request with the authenticated user ────────

declare global {
  namespace Express {
    interface Request {
      user?: AccessTokenPayload & { _id: Types.ObjectId };
    }
  }
}
