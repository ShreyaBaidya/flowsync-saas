import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import {
  createProject,
  listProjects,
  getProject,
  updateProject,
  deleteProject,
} from '../controllers/projectController';

const router = Router();

router.use(authenticate);

router.get('/',     listProjects);
router.post('/',    createProject);
router.get('/:id',  getProject);
router.put('/:id',  updateProject);
router.delete('/:id', deleteProject);

export default router;
