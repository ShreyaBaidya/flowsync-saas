import crypto from 'crypto';
import { Schema, model, Document, Model, Types } from 'mongoose';

// ── Document interface ────────────────────────────────────────

export interface IRefreshToken extends Document {
  _id:         Types.ObjectId;
  user:        Types.ObjectId;
  hashedToken: string;
  expiresAt:   Date;
  createdAt:   Date;
  lastUsedAt:  Date;
  userAgent:   string;
  ipAddress:   string;
}

// ── Model interface with static helpers ───────────────────────

export interface IRefreshTokenModel extends Model<IRefreshToken> {
  /**
   * Hash a raw token string before storing or looking it up.
   * SHA-256 is sufficient here — the raw token is already
   * a cryptographically random value, not a password.
   */
  hashToken(raw: string): string;

  /**
   * Find an active (non-expired) token record by its raw value.
   */
  findByRawToken(raw: string): Promise<IRefreshToken | null>;
}

// ── Schema ────────────────────────────────────────────────────

const refreshTokenSchema = new Schema<IRefreshToken, IRefreshTokenModel>(
  {
    user: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'User reference is required'],
      index:    true,
    },

    hashedToken: {
      type:     String,
      required: [true, 'Hashed token is required'],
      unique:   true, // one record per token; prevents duplicate inserts
    },

    expiresAt: {
      type:     Date,
      required: [true, 'Expiry date is required'],
      index:    true,
    },

    lastUsedAt: {
      type:    Date,
      default: Date.now,
    },

    userAgent: {
      type:    String,
      trim:    true,
      default: 'unknown',
    },

    ipAddress: {
      type:    String,
      trim:    true,
      default: 'unknown',
    },
  },
  {
    timestamps: true,   // adds createdAt automatically
    versionKey: false,
  },
);

// ── TTL index — MongoDB auto-deletes expired documents ────────
// This keeps the collection clean without a cron job.

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// ── Compound index — fast per-user lookups ────────────────────
// Used by logoutAll() to delete every token for a given user,
// and by the device list query (show active sessions).

refreshTokenSchema.index({ user: 1, expiresAt: 1 });

// ── Static methods ────────────────────────────────────────────

refreshTokenSchema.static('hashToken', function (raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
});

refreshTokenSchema.static(
  'findByRawToken',
  async function (raw: string): Promise<IRefreshToken | null> {
    const hashed = RefreshToken.hashToken(raw);
    return this.findOne({
      hashedToken: hashed,
      expiresAt:   { $gt: new Date() }, // reject expired tokens
    });
  },
);

// ── Model export ──────────────────────────────────────────────

export const RefreshToken = model<IRefreshToken, IRefreshTokenModel>(
  'RefreshToken',
  refreshTokenSchema,
);
