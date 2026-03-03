import { Router } from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth, requireAdmin } from '../middleware/authenticate';
import { prisma } from '../lib/prisma';

export const adminRoutes = Router();

// All admin routes require authentication + admin role
adminRoutes.use(requireAuth, requireAdmin);

// ── GET /api/admin/users ──────────────────────────────────────────────────────
adminRoutes.get('/users', async (_req: Request, res: Response): Promise<void> => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      avatarUrl: true,
      createdAt: true,
      googleId: true,
      password: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const sanitised = users.map(({ password, googleId, ...u }) => ({
    ...u,
    hasPassword: !!password,
    hasGoogle: !!googleId,
  }));

  res.json({ success: true, data: { users: sanitised } });
});

// ── DELETE /api/admin/users/:id ───────────────────────────────────────────────
adminRoutes.delete('/users/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (id === req.user!.id) {
    res.status(400).json({ success: false, error: 'Vous ne pouvez pas supprimer votre propre compte.' });
    return;
  }

  const target = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (!target) {
    res.status(404).json({ success: false, error: 'Utilisateur introuvable.' });
    return;
  }
  if (target.role === 'ADMIN') {
    res.status(403).json({ success: false, error: 'Impossible de supprimer un autre administrateur.' });
    return;
  }

  await prisma.user.delete({ where: { id } });
  res.json({ success: true });
});

// ── GET /api/admin/blacklist ──────────────────────────────────────────────────
adminRoutes.get('/blacklist', async (_req: Request, res: Response): Promise<void> => {
  const entries = await prisma.blacklistedEmail.findMany({
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: { entries } });
});

// ── POST /api/admin/blacklist ─────────────────────────────────────────────────
const blacklistSchema = z.object({
  email: z.string().email('Email invalide').max(255),
  reason: z.string().max(500).optional(),
});

adminRoutes.post('/blacklist', async (req: Request, res: Response): Promise<void> => {
  const parsed = blacklistSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.errors[0].message });
    return;
  }

  const { email, reason } = parsed.data;
  const normalised = email.toLowerCase();

  const existing = await prisma.blacklistedEmail.findUnique({ where: { email: normalised } });
  if (existing) {
    res.status(409).json({ success: false, error: 'Cet email est déjà banni.' });
    return;
  }

  const entry = await prisma.blacklistedEmail.create({
    data: { email: normalised, reason: reason ?? null, bannedBy: req.user!.id },
  });
  res.status(201).json({ success: true, data: { entry } });
});

// ── DELETE /api/admin/blacklist/:id ──────────────────────────────────────────
adminRoutes.delete('/blacklist/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const existing = await prisma.blacklistedEmail.findUnique({ where: { id }, select: { id: true } });
  if (!existing) {
    res.status(404).json({ success: false, error: 'Entrée introuvable.' });
    return;
  }

  await prisma.blacklistedEmail.delete({ where: { id } });
  res.json({ success: true });
});
