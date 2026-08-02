import 'dotenv/config';

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';

import routes from './routes/index';
import { notFound } from './middleware/notFound';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// ── 1. Security headers ───────────────────────────────────────
app.use(helmet());

// ── 2. Compression ────────────────────────────────────────────
app.use(compression());

// ── 3. CORS ───────────────────────────────────────────────────
app.use(
  cors({
    origin:       process.env['CLIENT_URL'] ?? 'http://localhost:3000',
    credentials:  true,
    methods:      ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// ── 4. HTTP request logging ───────────────────────────────────
app.use(morgan('dev'));

// ── 5. Cookie parser ──────────────────────────────────────────
app.use(cookieParser());

// ── 6. Body parsers ───────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health check (no auth, no versioning) ────────────────────
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
  });
});

// ── API routes ────────────────────────────────────────────────
app.use('/api/v1', routes);

// ── 404 handler (must come after all routes) ─────────────────
app.use(notFound);

// ── Global error handler (must be last) ──────────────────────
app.use(errorHandler);

export default app;
