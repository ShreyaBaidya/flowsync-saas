/**
 * healthRoutes.ts
 * Mounts health-check endpoints.
 *
 * GET /health        → liveness
 * GET /health/ready  → readiness (includes DB ping)
 */

import { Router } from 'express';
import { getLiveness, getReadiness } from '../controllers/healthController';

const router = Router();

router.get('/',      getLiveness);
router.get('/ready', getReadiness);

export default router;
