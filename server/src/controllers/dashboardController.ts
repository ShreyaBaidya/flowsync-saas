import { Request, Response, NextFunction } from 'express';
import { getDashboardStats } from '../services/dashboardService';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';

export async function getDashboard(
  req: Request, res: Response, next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw ApiError.unauthorized();

    const stats = await getDashboardStats(req.user.id);

    ApiResponse.success(res, 'Dashboard data retrieved successfully', stats);
  } catch (err) { next(err); }
}
