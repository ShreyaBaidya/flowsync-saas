export type UserRole = 'user' | 'admin';
export type UserPlan = 'starter' | 'pro';

// ── Safe shape returned to clients (no password) ─────────────
export interface SafeUser {
  id:              string;
  name:            string;
  email:           string;
  avatar:          string | null;
  role:            UserRole;
  plan:            UserPlan;
  isEmailVerified: boolean;
  createdAt:       string;
  updatedAt:       string;
}
