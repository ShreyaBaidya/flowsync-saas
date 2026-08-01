/**
 * taskRoutes.ts
 * All routes require a valid JWT (authenticate middleware).
 * Authorization (project owner vs member, task creator) is enforced inside taskService.
 *
 * Mounted at: /api/v1/projects/:projectId/tasks
 *
 * POST   /api/v1/projects/:projectId/tasks       — create task
 * GET    /api/v1/projects/:projectId/tasks       — list tasks (paginated/filtered/sorted)
 * GET    /api/v1/projects/:projectId/tasks/:id   — get single task
 * PUT    /api/v1/projects/:projectId/tasks/:id   — update task
 * DELETE /api/v1/projects/:projectId/tasks/:id   — delete task
 */

import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import {
  createTask,
  listTasks,
  getTask,
  updateTask,
  deleteTask,
} from '../controllers/taskController';

// mergeParams: true exposes :projectId from the parent router
const router = Router({ mergeParams: true });

// All task routes require authentication
router.use(authenticate);

router.post('/',    createTask);
router.get('/',     listTasks);
router.get('/:id',  getTask);
router.put('/:id',  updateTask);
router.delete('/:id', deleteTask);

export default router;
