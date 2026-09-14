import type { Actor } from "../auth/permissions.js";

declare global {
  namespace Express {
    interface Request {
      user?: Actor;
    }
  }
}

export {};
