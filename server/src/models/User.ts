/**
 * User.ts
 * Mongoose model for FlowSync users.
 *
 * Security notes:
 *  - passwordHash is excluded from all query results by default (select: false)
 *  - comparePassword is an instance method — never expose the hash to callers
 *  - toSafeObject strips all sensitive fields before sending to clients
 */

import { Schema, model, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from '../config/env';
import { UserPlan, SafeUser } from '../types/auth.types';

// ── Document interface ───────────────────────────────────────

export interface IUser extends Document {
  name:            string;
  email:           string;
  passwordHash:    string;
  plan:            UserPlan;
  trialStartedAt?: Date;
  createdAt:       Date;
  updatedAt:       Date;

  // Instance methods
  comparePassword(candidate: string): Promise<boolean>;
  toSafeObject(): SafeUser;
  getInitials(): string;
}

// ── Model interface (for static methods if needed later) ─────
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface IUserModel extends Model<IUser> {}

// ── Schema ───────────────────────────────────────────────────

const userSchema = new Schema<IUser, IUserModel>(
  {
    name: {
      type:      String,
      required:  [true, 'Name is required'],
      trim:      true,
      minlength: [2,  'Name must be at least 2 characters'],
      maxlength: [80, 'Name must be at most 80 characters'],
    },
    email: {
      type:      String,
      required:  [true, 'Email is required'],
      unique:    true,
      lowercase: true,
      trim:      true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },
    passwordHash: {
      type:     String,
      required: [true, 'Password is required'],
      select:   false,   // ← Never returned in queries unless explicitly requested
    },
    plan: {
      type:    String,
      enum:    ['starter', 'pro_trial', 'pro', 'enterprise'],
      default: 'starter',
    },
    trialStartedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,      // Adds createdAt + updatedAt
    versionKey: false,
  },
);

// ── Indexes ───────────────────────────────────────────────────
// email already indexed via unique:true
// Add compound or additional indexes here as the schema grows

// ── Hooks ────────────────────────────────────────────────────

/**
 * Hash the plain-text password before save.
 * Only runs when the passwordHash field is new or modified.
 * NOTE: this hook receives the plain-text password in passwordHash.
 * Callers set `user.passwordHash = plainTextPassword` before save,
 * and the hook replaces it with the bcrypt hash.
 */
userSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();

  try {
    const salt      = await bcrypt.genSalt(env.BCRYPT_ROUNDS);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (err) {
    next(err as Error);
  }
});

// ── Instance methods ──────────────────────────────────────────

/**
 * Compare a plain-text password against the stored bcrypt hash.
 * Always requires passwordHash to be selected (use .select('+passwordHash')).
 */
userSchema.methods.comparePassword = async function (
  this: IUser,
  candidate: string,
): Promise<boolean> {
  return bcrypt.compare(candidate, this.passwordHash);
};

/**
 * Derive initials from the user's name (up to 2 characters).
 * Mirrors the frontend FlowsyncAuth.getInitials() logic.
 */
userSchema.methods.getInitials = function (this: IUser): string {
  const parts = this.name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/**
 * Return a plain object safe to send to clients.
 * Excludes passwordHash and internal Mongoose fields.
 */
userSchema.methods.toSafeObject = function (this: IUser): SafeUser {
  return {
    id:              (this._id as { toString(): string }).toString(),
    name:            this.name,
    email:           this.email,
    initials:        this.getInitials(),
    plan:            this.plan,
    ...(this.trialStartedAt && {
      trialStartedAt: this.trialStartedAt.toISOString(),
    }),
    signedInAt: new Date().toISOString(),   // Set fresh on login
    createdAt:  this.createdAt.toISOString(),
  };
};

// ── Model export ─────────────────────────────────────────────

export const User = model<IUser, IUserModel>('User', userSchema);
