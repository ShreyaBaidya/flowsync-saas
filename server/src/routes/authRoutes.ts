import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import {
  signup,
  signin,
  refresh,
  logout,
  logoutAll,
  getMe,
} from '../controllers/authController';

const router = Router();

// ── Public ────────────────────────────────────────────────────
router.post('/signup',     signup);
router.post('/signin',     signin);
router.post('/refresh',    refresh);

// ── Protected ─────────────────────────────────────────────────
router.post('/logout',     authenticate, logout);
router.post('/logout-all', authenticate, logoutAll);
router.get('/me',          authenticate, getMe);

export default router;
