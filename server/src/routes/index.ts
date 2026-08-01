/**
 * routes/index.ts
 * Central route registry — all route modules mounted here.
 */

import { Router } from 'express';
import healthRoutes    from './healthRoutes';
import authRoutes      from './authRoutes';
import projectRoutes   from './projectRoutes';
import taskRoutes      from './taskRoutes';
import dashboardRoutes from './dashboardRoutes';
// Future imports:
// import userRoutes     from './userRoutes';
// import teamRoutes     from './teamRoutes';
// import activityRoutes from './activityRoutes';
// import billingRoutes  from './billingRoutes';

const router = Router();

router.use('/health',    healthRoutes);
router.use('/auth',      authRoutes);
router.use('/projects',  projectRoutes);
// Tasks are nested under projects: /projects/:projectId/tasks
router.use('/projects/:projectId/tasks', taskRoutes);
router.use('/dashboard', dashboardRoutes);
// router.use('/users',    userRoutes);
// router.use('/team',     teamRoutes);
// router.use('/activity', activityRoutes);
// router.use('/billing',  billingRoutes);

export default router;
