/**
 * database.ts
 * MongoDB connection management via Mongoose.
 * Handles connect, disconnect, and connection lifecycle events.
 */

import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../utils/logger';

// Mongoose global settings
mongoose.set('strictQuery', true);

export async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI, {
      // Connection pool
      maxPoolSize:     10,
      minPoolSize:     2,
      socketTimeoutMS: 45_000,
      serverSelectionTimeoutMS: 5_000,
    });

    logger.info(`[Database] Connected — ${sanitiseUri(env.MONGODB_URI)}`);
  } catch (error) {
    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.error('[Database] Could not connect to MongoDB.');
    logger.error('');
    logger.error('To fix this, choose one of:');
    logger.error('');
    logger.error('  Option A — Local MongoDB (Windows):');
    logger.error('    1. Download MongoDB Community: https://www.mongodb.com/try/download/community');
    logger.error('    2. Install it and ensure the MongoDB service is running.');
    logger.error('    3. MONGODB_URI in .env should be: mongodb://127.0.0.1:27017/flowsync');
    logger.error('');
    logger.error('  Option B — MongoDB Atlas (free cloud, recommended):');
    logger.error('    1. Sign up at https://cloud.mongodb.com (free M0 tier)');
    logger.error('    2. Create a cluster, then click Connect → Drivers');
    logger.error('    3. Copy the connection string and paste it into .env:');
    logger.error('       MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/flowsync');
    logger.error('');
    logger.error(`  Current URI: ${sanitiseUri(env.MONGODB_URI)}`);
    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    process.exit(1);
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  logger.info('[Database] Disconnected');
}

// ── Connection event listeners ──────────────────────────────
mongoose.connection.on('disconnected', () => {
  logger.warn('[Database] Disconnected from MongoDB');
});

mongoose.connection.on('reconnected', () => {
  logger.info('[Database] Reconnected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  logger.error('[Database] Connection error:', err);
});

// ── Helpers ─────────────────────────────────────────────────

/** Strip credentials from a MongoDB URI for safe logging */
function sanitiseUri(uri: string): string {
  try {
    const u = new URL(uri);
    return `${u.protocol}//${u.host}${u.pathname}`;
  } catch {
    return '[invalid URI]';
  }
}
