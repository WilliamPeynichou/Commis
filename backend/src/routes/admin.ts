import { Router } from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod';
import type { Role } from '@prisma/client';
import { requireAuth, requireAdmin } from '../middleware/authenticate';
import {
  getAdminStats,
  getAdminUsers,
  changeUserRole,
  getAdminActivity,
  getAdminLogs,
} from '../services/adminService';
import { prisma } from '../lib/prisma';

export const adminRoutes = Router();

// All admin routes require auth + admin role
adminRoutes.use(requireAuth, requireAdmin);

// ── GET /api/admin/stats ───────────────────────────────────────────────────────
adminRoutes.get('/stats', async (_req: Request, res: Response): Promise<void> => {
  try {
    const stats = await getAdminStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    console.error('[/admin/stats]', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la récupération des statistiques.' });
  }
});

// ── GET /api/admin/users ───────────────────────────────────────────────────────
const usersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(100).optional(),
  role: z.enum(['USER', 'ADMIN', '']).optional(),
});

adminRoutes.get('/users', async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = usersQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: 'Paramètres invalides.' });
      return;
    }
    const { page, limit, search, role } = parsed.data;
    const result = await getAdminUsers({ page, limit, search, role: role as Role | '' });
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[/admin/users]', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la récupération des utilisateurs.' });
  }
});

// ── PATCH /api/admin/users/:userId/role ───────────────────────────────────────
const changeRoleSchema = z.object({
  role: z.enum(['USER', 'ADMIN']),
});

adminRoutes.patch('/users/:userId/role', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params['userId'] as string;

    // Guard: cannot change own role
    if (req.user!.id === userId) {
      res.status(400).json({ success: false, error: 'Vous ne pouvez pas modifier votre propre rôle.' });
      return;
    }

    const parsed = changeRoleSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: 'Rôle invalide.' });
      return;
    }
    const { role: newRole } = parsed.data;

    // Guard: cannot demote last admin
    if (newRole === 'USER') {
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
      if (adminCount <= 1) {
        res.status(400).json({ success: false, error: 'Impossible de rétrograder le dernier administrateur.' });
        return;
      }
    }

    await changeUserRole(req.user!.id, userId, newRole as Role);
    res.json({ success: true });
  } catch (err) {
    console.error('[/admin/users/:userId/role]', err);
    res.status(500).json({ success: false, error: 'Erreur lors du changement de rôle.' });
  }
});

// ── GET /api/admin/activity ────────────────────────────────────────────────────
const activityQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
});

adminRoutes.get('/activity', async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = activityQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: 'Paramètres invalides.' });
      return;
    }
    const { page, limit, from, to } = parsed.data;
    const result = await getAdminActivity({
      page,
      limit,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[/admin/activity]', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la récupération de l\'activité.' });
  }
});

// ── GET /api/admin/logs ────────────────────────────────────────────────────────
const logsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

adminRoutes.get('/logs', async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = logsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: 'Paramètres invalides.' });
      return;
    }
    const result = await getAdminLogs(parsed.data);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[/admin/logs]', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la récupération des logs.' });
  }
});
