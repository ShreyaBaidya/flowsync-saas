/**
 * authRoutes.ts
 *
 * POST   /api/v1/auth/signup    — register new user
 * POST   /api/v1/auth/signin    — authenticate, receive access token + cookie
 * POST   /api/v1/auth/signout   — revoke refresh token, clear cookie
 * POST   /api/v1/auth/refresh   — exchange refresh cookie for new access token
 * GET    /api/v1/auth/me        — return current user (protected)
 */

import { Router } from 'express';
import { authLimiter } from '../middleware/rateLimiter';
import { authenticate } from '../middleware/authenticate';
import {
  signUp,
  signIn,
  signOut,
  refreshTokens,
  getMe,
} from '../controllers/authController';

const router = Router();

// Apply the strict rate limiter to all auth mutation endpoints
router.post('/signup',  authLimiter, signUp);
router.post('/signin',  authLimiter, signIn);
router.post('/signout', signOut);           // No auth required to sign out
router.post('/refresh', authLimiter, refreshTokens);

// Protected — requires valid access token
router.get('/me', authenticate, getMe);

export default router;
