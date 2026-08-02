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

router.use(authenticate);

router.get('/',      listTasks);
router.post('/',     createTask);
router.get('/:id',   getTask);
router.put('/:id',   updateTask);
router.delete('/:id', deleteTask);

export default router;
