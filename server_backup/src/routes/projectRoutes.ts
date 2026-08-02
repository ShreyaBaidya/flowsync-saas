/**
 * projectRoutes.ts
 * All routes require a valid JWT (authenticate middleware).
 * Authorization (owner vs member) is enforced inside projectService.
 *
 * POST   /api/v1/projects              — create project
 * GET    /api/v1/projects              — list projects (paginated/filtered/sorted)
 * GET    /api/v1/projects/:id          — get single project
 * PUT    /api/v1/projects/:id          — update project (owner or member)
 * DELETE /api/v1/projects/:id          — delete project (owner only)
 * PATCH  /api/v1/projects/:id/archive  — archive project (owner or member)
 */

import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import {
  createProject,
  listProjects,
  getProject,
  updateProject,
  deleteProject,
  archiveProject,
} from '../controllers/projectController';

const router = Router();

// All project routes require authentication
router.use(authenticate);

router.post('/',                createProject);
router.get('/',                 listProjects);
router.get('/:id',              getProject);
router.put('/:id',              updateProject);
router.delete('/:id',           deleteProject);
router.patch('/:id/archive',    archiveProject);

export default router;
