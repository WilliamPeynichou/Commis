import jwt from 'jsonwebtoken';
import { createHmac, randomBytes } from 'crypto';
import type { Response } from 'express';
import type { Role } from '@prisma/client';

// ── Constants ─────────────────────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET!;
const COOKIE_NAME = 'commis_token';
const TOKEN_DURATION_S = 30 * 24 * 60 * 60; // 30 days in seconds
const COOKIE_MAX_AGE_MS = TOKEN_DURATION_S * 1000;
const IS_PROD = process.env.NODE_ENV === 'production';

// ── JWT ───────────────────────────────────────────────────────────────────────
export interface JwtPayload {
  sub: string; // userId
  role: Role;
}

export function signJWT(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: TOKEN_DURATION_S,
    algorithm: 'HS256',
  });
}

export function verifyJWT(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as JwtPayload;
  } catch {
    return null;
  }
}

// ── Cookie ────────────────────────────────────────────────────────────────────
export function setAuthCookie(res: Response, token: string): void {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'strict',
    maxAge: COOKIE_MAX_AGE_MS,
    path: '/',
  });
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME, { path: '/' });
}

export function extractTokenFromRequest(req: {
  cookies?: Record<string, string>;
  headers: Record<string, string | string[] | undefined>;
}): string | null {
  // 1. HttpOnly cookie (preferred)
  if (req.cookies?.[COOKIE_NAME]) return req.cookies[COOKIE_NAME];
  // 2. Authorization: Bearer <token> header (API clients)
  const auth = req.headers['authorization'];
  const header = Array.isArray(auth) ? auth[0] : auth;
  if (header?.startsWith('Bearer ')) return header.slice(7);
  return null;
}

// ── Google OAuth state (CSRF protection without sessions) ────────────────────
export function createOAuthState(): string {
  const nonce = randomBytes(16).toString('hex');
  const exp = Date.now() + 5 * 60 * 1000; // 5 min window
  const payload = `${nonce}.${exp}`;
  const sig = createHmac('sha256', JWT_SECRET).update(payload).digest('hex');
  return Buffer.from(`${payload}.${sig}`).toString('base64url');
}

export function verifyOAuthState(state: unknown): boolean {
  if (typeof state !== 'string') return false;
  try {
    const decoded = Buffer.from(state, 'base64url').toString();
    const parts = decoded.split('.');
    if (parts.length !== 3) return false;
    const [nonce, expStr, sig] = parts;
    const payload = `${nonce}.${expStr}`;
    const expected = createHmac('sha256', JWT_SECRET).update(payload).digest('hex');
    if (sig !== expected) return false;
    if (Date.now() > parseInt(expStr, 10)) return false;
    return true;
  } catch {
    return false;
  }
}
