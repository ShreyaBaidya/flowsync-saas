import type { SafeUser } from './user.types';

declare global {
  namespace Express {
    interface Request {
      user?: SafeUser;
    }
  }
}

export {};
