import { Router } from 'express';
import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import {
  signJWT,
  setAuthCookie,
  clearAuthCookie,
  createOAuthState,
  verifyOAuthState,
} from '../lib/auth';
import { requireAuth } from '../middleware/authenticate';
import {
  findUserById,
  findUserByEmailWithPassword,
  createUser,
  upsertGoogleUser,
  isUsernameTaken,
  isEmailTaken,
} from '../services/userService';

export const authRoutes = Router();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const BCRYPT_ROUNDS = 12;

// ── Validation schemas ────────────────────────────────────────────────────────
const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Pseudo minimum 3 caractères')
    .max(30, 'Pseudo maximum 30 caractères')
    .regex(/^[a-zA-Z0-9_]+$/, 'Pseudo : lettres, chiffres et _ uniquement'),
  email: z.string().email('Email invalide').max(255),
  password: z
    .string()
    .min(8, 'Mot de passe minimum 8 caractères')
    .max(128)
    .regex(/[a-zA-Z]/, 'Le mot de passe doit contenir au moins une lettre')
    .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ── POST /api/auth/register ───────────────────────────────────────────────────
authRoutes.post('/register', async (req: Request, res: Response): Promise<void> => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: parsed.error.errors[0].message,
    });
    return;
  }

  const { username, email, password } = parsed.data;

  if (await isUsernameTaken(username)) {
    res.status(409).json({ success: false, error: 'Ce pseudo est déjà utilisé.' });
    return;
  }
  if (await isEmailTaken(email)) {
    res.status(409).json({ success: false, error: 'Cet email est déjà enregistré.' });
    return;
  }

  const hashed = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await createUser({ username, email, password: hashed });

  const token = signJWT({ sub: user.id, role: user.role });
  setAuthCookie(res, token);

  res.status(201).json({ success: true, data: { user } });
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
authRoutes.post('/login', async (req: Request, res: Response): Promise<void> => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'Email ou mot de passe invalide.' });
    return;
  }

  const { email, password } = parsed.data;
  const user = await findUserByEmailWithPassword(email);

  // Constant-time check even when user not found (prevents timing attacks)
  const hash = user?.password ?? '$2b$12$invalidhashpaddingtoensureconstanttime00000000000000000';
  const valid = await bcrypt.compare(password, hash);

  if (!user || !valid || !user.password) {
    res.status(401).json({ success: false, error: 'Email ou mot de passe incorrect.' });
    return;
  }

  const token = signJWT({ sub: user.id, role: user.role });
  setAuthCookie(res, token);

  // Strip password from response
  const { password: _pw, ...publicUser } = user;
  res.json({ success: true, data: { user: publicUser } });
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
authRoutes.get('/me', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const user = await findUserById(req.user!.id);
  if (!user) {
    clearAuthCookie(res);
    res.status(401).json({ success: false, error: 'Compte introuvable.' });
    return;
  }
  res.json({ success: true, data: { user } });
});

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
authRoutes.post('/logout', (_req: Request, res: Response): void => {
  clearAuthCookie(res);
  res.json({ success: true });
});

// ── GET /api/auth/google ──────────────────────────────────────────────────────
authRoutes.get('/google', (_req: Request, res: Response): void => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CALLBACK_URL) {
    res.status(503).json({ success: false, error: 'Google OAuth non configuré.' });
    return;
  }
  const state = createOAuthState();
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: process.env.GOOGLE_CALLBACK_URL,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'online',
    prompt: 'select_account',
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

// ── GET /api/auth/google/callback ─────────────────────────────────────────────
authRoutes.get('/google/callback', async (req: Request, res: Response): Promise<void> => {
  const { code, state, error } = req.query;

  if (error || !verifyOAuthState(state)) {
    res.redirect(`${FRONTEND_URL}?auth=error`);
    return;
  }

  try {
    // Exchange code for access_token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: code as string,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: process.env.GOOGLE_CALLBACK_URL!,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json() as { access_token?: string; error?: string };
    if (!tokenData.access_token) throw new Error('No access_token from Google');

    // Get user profile
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileRes.json() as {
      id: string;
      email: string;
      name: string;
      picture?: string;
    };

    const user = await upsertGoogleUser({
      googleId: profile.id,
      email: profile.email,
      suggestedUsername: profile.name,
      avatarUrl: profile.picture,
    });

    const token = signJWT({ sub: user.id, role: user.role });
    setAuthCookie(res, token);
    res.redirect(`${FRONTEND_URL}?auth=success`);
  } catch (err) {
    console.error('[Google OAuth callback]', err);
    res.redirect(`${FRONTEND_URL}?auth=error`);
  }
});
