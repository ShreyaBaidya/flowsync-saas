/**
 * dashboardController.ts
 * HTTP layer for the Dashboard module.
 *
 * Routes handled:
 *   GET /api/v1/dashboard  — return summary metrics for the current user
 */

import { Request, Response, NextFunction } from 'express';
import { getDashboardSummary } from '../services/dashboardService';
import { ApiResponse }         from '../utils/ApiResponse';
import { ApiError }            from '../utils/ApiError';

// ── GET /dashboard ────────────────────────────────────────────

export async function getDashboard(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw ApiError.unauthorized();

    const summary = await getDashboardSummary(req.user.sub);
    ApiResponse.success(res, summary);
  } catch (err) {
    next(err);
  }
}
