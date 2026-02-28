import type { Request, Response, NextFunction } from 'express';
import { extractTokenFromRequest, verifyJWT } from '../lib/auth';
import type { Role } from '@prisma/client';

// Augment Express Request with optional user
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: string; role: Role };
    }
  }
}

/**
 * Extracts and attaches the authenticated user to req.user if a valid JWT is
 * present. Does NOT reject the request — use requireAuth for protected routes.
 */
export function extractUser(req: Request, _res: Response, next: NextFunction): void {
  const token = extractTokenFromRequest(req);
  if (token) {
    const payload = verifyJWT(token);
    if (payload) req.user = { id: payload.sub, role: payload.role };
  }
  next();
}

/** Rejects unauthenticated requests with 401. */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentification requise.' });
    return;
  }
  next();
}

/** Rejects non-admin requests with 403. Must be used after requireAuth. */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (req.user?.role !== 'ADMIN') {
    res.status(403).json({ success: false, error: 'Accès réservé aux administrateurs.' });
    return;
  }
  next();
}
