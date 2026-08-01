/**
 * index.ts
 * Server entry point.
 * Connects to the database, then starts the HTTP server.
 * The Express app factory (createApp) lives in app.ts so it can be
 * imported separately in tests without binding to a port.
 */

import { createApp } from './app';
import { connectDatabase } from './config/database';
import { env } from './config/env';
import { logger } from './utils/logger';

async function main(): Promise<void> {
  // ── 1. Connect to MongoDB ─────────────────────────────────
  // connectDatabase() calls process.exit(1) on failure, so if we reach
  // step 2 the connection is confirmed healthy.
  await connectDatabase();

  // ── 2. Build the Express app ──────────────────────────────
  const app = createApp();

  // ── 3. Start listening ────────────────────────────────────
  const server = app.listen(env.PORT, () => {
    logger.info(`[Server] Running on port ${env.PORT} (${env.NODE_ENV})`);
    logger.info(`[Server] API prefix: ${env.API_PREFIX}`);
    logger.info(`[Server] Health:  GET ${env.API_PREFIX}/health`);
    logger.info(`[Server] Auth:    POST ${env.API_PREFIX}/auth/signup`);
    logger.info(`[Server] Auth:    POST ${env.API_PREFIX}/auth/signin`);
    logger.info(`[Server] Auth:    POST ${env.API_PREFIX}/auth/signout`);
    logger.info(`[Server] Auth:    POST ${env.API_PREFIX}/auth/refresh`);
    logger.info(`[Server] Auth:    GET  ${env.API_PREFIX}/auth/me`);
  });

  // ── 4. Graceful shutdown ──────────────────────────────────
  function shutdown(signal: string): void {
    logger.info(`[Server] ${signal} received — shutting down gracefully`);
    server.close(async () => {
      logger.info('[Server] HTTP server closed');
      // Mongoose disconnects itself via the connection event listeners
      // in database.ts, but we close explicitly here to be safe.
      const mongoose = await import('mongoose');
      await mongoose.default.disconnect();
      logger.info('[Server] Shutdown complete');
      process.exit(0);
    });

    // Force-kill if shutdown takes longer than 10 seconds
    setTimeout(() => {
      logger.error('[Server] Forced shutdown after timeout');
      process.exit(1);
    }, 10_000).unref();
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));

  // ── 5. Unhandled rejection / exception guards ─────────────
  process.on('unhandledRejection', (reason) => {
    logger.error('[Server] Unhandled Promise Rejection:', reason);
    // Don't exit — log it and let the process continue
  });

  process.on('uncaughtException', (err) => {
    logger.error('[Server] Uncaught Exception:', err);
    // Uncaught exceptions leave the process in an undefined state — exit
    process.exit(1);
  });
}

main();
