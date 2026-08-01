/**
 * RefreshToken.ts
 * Stores issued refresh tokens so they can be invalidated
 * on logout, rotation, or "sign out all devices".
 *
 * Strategy: token rotation — every refresh call issues a new
 * token and invalidates the previous one. A stolen token can
 * only be used once before it is rotated out.
 *
 * TTL index on expiresAt lets MongoDB automatically purge
 * expired documents — no manual cleanup needed.
 */

import { Schema, model, Document, Types } from 'mongoose';

export interface IRefreshToken extends Document {
  userId:    Types.ObjectId;
  token:     string;          // Opaque random string stored in httpOnly cookie
  expiresAt: Date;
  createdAt: Date;
  isRevoked: boolean;
}

const refreshTokenSchema = new Schema<IRefreshToken>(
  {
    userId: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },
    token: {
      type:     String,
      required: true,
      unique:   true,
      index:    true,
    },
    expiresAt: {
      type:     Date,
      required: true,
    },
    isRevoked: {
      type:    Boolean,
      default: false,
    },
  },
  {
    timestamps:  { createdAt: true, updatedAt: false },
    versionKey:  false,
  },
);

// MongoDB TTL index — automatically removes documents after expiresAt
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshToken = model<IRefreshToken>(
  'RefreshToken',
  refreshTokenSchema,
);
