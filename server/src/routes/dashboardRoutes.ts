/**
 * dashboardRoutes.ts
 * All routes require a valid JWT (authenticate middleware).
 *
 * GET  /api/v1/dashboard  — return summary metrics for the current user
 */

import { Router }       from 'express';
import { authenticate } from '../middleware/authenticate';
import { getDashboard } from '../controllers/dashboardController';

const router = Router();

router.use(authenticate);

router.get('/', getDashboard);

export default router;
