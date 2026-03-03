import { Router } from 'express';
import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const dietRoutes = Router();

// GET /api/diets — public, returns all diets ordered by name
dietRoutes.get('/', async (_req: Request, res: Response): Promise<void> => {
  const diets = await prisma.diet.findMany({ orderBy: { name: 'asc' } });
  res.json({ success: true, data: { diets } });
});
