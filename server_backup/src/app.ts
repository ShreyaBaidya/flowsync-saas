/**
 * app.ts
 * Express application factory.
 * Separated from index.ts so the app instance can be imported
 * in tests without starting the HTTP server.
 */

import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';

import { env } from './config/env';
import { attachRequestId, requestLogger } from './middleware/requestLogger';
import { generalLimiter } from './middleware/rateLimiter';
import { notFound } from './middleware/notFound';
import { errorHandler } from './middleware/errorHandler';
import apiRoutes from './routes/index';

export function createApp(): Application {
  const app = express();

  // ── 1. Security headers ──────────────────────────────────
  app.use(
    helmet({
      // Strict-Transport-Security: enforce HTTPS for 1 year in production
      hsts: env.isProd
        ? { maxAge: 31_536_000, includeSubDomains: true }
        : false,
      // Prevent MIME-type sniffing
      noSniff: true,
      // Block pages from being loaded in iframes on other origins
      frameguard: { action: 'sameorigin' },
      // Disable browser XSS filter (modern browsers use CSP instead)
      xssFilter: true,
      // Content-Security-Policy — tightened for production
      contentSecurityPolicy: env.isProd
        ? {
            directives: {
              defaultSrc:  ["'self'"],
              scriptSrc:   ["'self'"],
              styleSrc:    ["'self'", "'unsafe-inline'"],
              imgSrc:      ["'self'", 'data:'],
              connectSrc:  ["'self'"],
              fontSrc:     ["'self'"],
              objectSrc:   ["'none'"],
              frameAncestors: ["'none'"],
            },
          }
        : false,   // Disabled in dev to avoid blocking local tooling
      // Required for cross-origin isolation — disabled to avoid breaking
      // the SPA frontend served from a different origin in development
      crossOriginEmbedderPolicy: false,
    }),
  );

  // ── 2. CORS ───────────────────────────────────────────────
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. curl, Postman, server-to-server)
        if (!origin) {
          callback(null, true);
          return;
        }
        if (env.CORS_ORIGINS.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`CORS: origin '${origin}' is not allowed`));
        }
      },
      credentials:      true,             // Required for cookies (auth)
      methods:          ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders:   ['Content-Type', 'Authorization', 'X-Request-ID'],
      exposedHeaders:   ['X-Request-ID'],
      maxAge:           600,              // Cache preflight for 10 min
    }),
  );

  // ── 3. Body parsers ───────────────────────────────────────
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // ── 4. Cookie parser (required for refresh token cookie) ──
  app.use(cookieParser());

  // ── 5. Response compression ───────────────────────────────
  app.use(compression());

  // ── 6. Attach Request ID ──────────────────────────────────
  app.use(attachRequestId);

  // ── 7. HTTP request logging ───────────────────────────────
  app.use(requestLogger);

  // ── 8. Global rate limiter ────────────────────────────────
  app.use(generalLimiter);

  // ── 9. Trust proxy (needed when behind Nginx / Railway / Render) ──
  app.set('trust proxy', 1);

  // ── 10. API routes ─────────────────────────────────────────
  app.use(env.API_PREFIX, apiRoutes);

  // ── 11. 404 handler (must come after all routes) ──────────
  app.use(notFound);

  // ── 12. Global error handler (must be last) ───────────────
  app.use(errorHandler);

  return app;
}
