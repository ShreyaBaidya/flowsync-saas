import { Router } from 'express';
import authRoutes      from './authRoutes';
import projectRoutes   from './projectRoutes';
import taskRoutes      from './taskRoutes';
import dashboardRoutes from './dashboardRoutes';

const router = Router();

router.use('/auth',      authRoutes);
router.use('/projects',  projectRoutes);
// Tasks are nested under projects: /projects/:projectId/tasks
router.use('/projects/:projectId/tasks', taskRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
