/**
 * healthController.ts
 * Health-check endpoints.
 *
 * GET /api/v1/health        — liveness probe (is the server running?)
 * GET /api/v1/health/ready  — readiness probe (is the DB connected?)
 */

import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { ApiResponse } from '../utils/ApiResponse';
import { env } from '../config/env';

interface HealthData {
  status:    'ok' | 'degraded' | 'down';
  timestamp: string;
  uptime:    number;
  version:   string;
  environment: string;
}

interface ReadinessData extends HealthData {
  services: {
    database: {
      status:  'connected' | 'disconnected' | 'connecting' | 'disconnecting';
      latency: number | null;
    };
  };
}

/** GET /api/v1/health — simple liveness check */
export async function getLiveness(
  _req: Request,
  res: Response,
): Promise<void> {
  const data: HealthData = {
    status:      'ok',
    timestamp:   new Date().toISOString(),
    uptime:      Math.floor(process.uptime()),
    version:     process.env.npm_package_version ?? '1.0.0',
    environment: env.NODE_ENV,
  };

  ApiResponse.success(res, data, 'Server is running');
}

/** GET /api/v1/health/ready — readiness check including DB ping */
export async function getReadiness(
  _req: Request,
  res: Response,
): Promise<void> {
  // Map Mongoose connection state numbers to readable strings
  const stateMap: Record<number, ReadinessData['services']['database']['status']> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const dbState   = mongoose.connection.readyState;
  const dbStatus  = stateMap[dbState] ?? 'disconnected';
  let   dbLatency: number | null = null;

  // Measure round-trip to MongoDB with a lightweight ping command
  if (dbState === 1) {
    const start = Date.now();
    try {
      await mongoose.connection.db?.admin().ping();
      dbLatency = Date.now() - start;
    } catch {
      dbLatency = null;
    }
  }

  const isReady = dbStatus === 'connected' && dbLatency !== null;

  const data: ReadinessData = {
    status:      isReady ? 'ok' : 'degraded',
    timestamp:   new Date().toISOString(),
    uptime:      Math.floor(process.uptime()),
    version:     process.env.npm_package_version ?? '1.0.0',
    environment: env.NODE_ENV,
    services: {
      database: {
        status:  dbStatus,
        latency: dbLatency,
      },
    },
  };

  // 200 if ready, 503 if not — allows load balancers / k8s probes to act
  const statusCode = isReady ? 200 : 503;
  res.status(statusCode).json({ success: isReady, data });
}
