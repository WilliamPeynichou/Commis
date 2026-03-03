import { Router } from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { generateRecipes, regenerateRecipe } from '../services/claude';
import type { DietInfo } from '../services/claude';
import { generateShoppingList } from '../services/shopping';
import { getHistory, saveToHistory } from '../services/historyService';
import { requireAuth } from '../middleware/authenticate';
import { prisma } from '../lib/prisma';
import {
  validate,
  generateRecipesSchema,
  regenerateRecipeSchema,
  shoppingListSchema,
} from '../middleware/validation';

export const recipeRoutes = Router();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function extractSessionId(req: Request): string | null {
  const raw = req.headers['x-session-id'];
  const id = Array.isArray(raw) ? raw[0] : raw;
  return id && UUID_RE.test(id) ? id : null;
}

async function resolveDiets(dietIds?: string[]): Promise<DietInfo[]> {
  if (!dietIds?.length) return [];
  try {
    const rows = await prisma.diet.findMany({ where: { id: { in: dietIds } } });
    return rows.map((d) => ({
      name: d.name,
      emoji: d.emoji,
      description: d.description,
      forbiddenIngredients: d.forbiddenIngredients as string[],
    }));
  } catch {
    return [];
  }
}

recipeRoutes.post(
  '/generate',
  validate(generateRecipesSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id ?? null;
      const sessionId = userId ? null : extractSessionId(req);

      const dbHistory = await getHistory({ userId, sessionId });
      const merged = [...new Set([...dbHistory, ...(req.body.previousRecipeNames ?? [])])];

      const diets = await resolveDiets(req.body.dietIds);
      const recipes = await generateRecipes({ ...req.body, previousRecipeNames: merged }, diets);

      let recipesWithIds = recipes;
      try {
        recipesWithIds = await Promise.all(
          recipes.map(async (recipe) => {
            const saved = await prisma.recipe.create({
              data: {
                name: recipe.name,
                description: recipe.description ?? null,
                category: recipe.category,
                preparationTime: recipe.preparationTime,
                ingredients: recipe.ingredients as object,
                steps: recipe.steps,
                pricePerPerson: recipe.pricePerPerson,
                nutrition: recipe.nutrition as object,
                userId: userId ?? undefined,
              },
            });
            return { ...recipe, id: saved.id };
          })
        );
      } catch (err) {
        console.warn('[/generate] Could not persist recipes:', err);
      }

      void saveToHistory(
        recipesWithIds.map((r) => ({ name: r.name, category: r.category })),
        { userId, sessionId }
      );

      res.json({ success: true, data: { recipes: recipesWithIds } });
    } catch (error) {
      console.error('[/generate]', error);
      res.status(500).json({ success: false, error: 'Erreur lors de la génération des recettes.' });
    }
  }
);

recipeRoutes.post(
  '/regenerate',
  validate(regenerateRecipeSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id ?? null;
      const sessionId = userId ? null : extractSessionId(req);

      const dbHistory = await getHistory({ userId, sessionId });
      const merged = [...new Set([...dbHistory, ...(req.body.existingRecipeNames ?? [])])];

      const diets = await resolveDiets(req.body.dietIds);
      const recipe = await regenerateRecipe({ ...req.body, existingRecipeNames: merged }, diets);

      let recipeWithId = recipe;
      try {
        const saved = await prisma.recipe.create({
          data: {
            name: recipe.name,
            description: recipe.description ?? null,
            category: recipe.category,
            preparationTime: recipe.preparationTime,
            ingredients: recipe.ingredients as object,
            steps: recipe.steps,
            pricePerPerson: recipe.pricePerPerson,
            nutrition: recipe.nutrition as object,
            userId: userId ?? undefined,
          },
        });
        recipeWithId = { ...recipe, id: saved.id };
      } catch (err) {
        console.warn('[/regenerate] Could not persist recipe:', err);
      }

      void saveToHistory(
        [{ name: recipeWithId.name, category: recipeWithId.category }],
        { userId, sessionId }
      );

      res.json({ success: true, data: { recipe: recipeWithId } });
    } catch (error) {
      console.error('[/regenerate]', error);
      res.status(500).json({ success: false, error: 'Erreur lors de la regénération de la recette.' });
    }
  }
);

recipeRoutes.post(
  '/shopping-list',
  validate(shoppingListSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const shoppingList = generateShoppingList(req.body.recipes, req.body.personsCount);
      res.json({ success: true, data: shoppingList });
    } catch (error) {
      console.error('[/shopping-list]', error);
      res.status(500).json({ success: false, error: 'Erreur lors de la génération de la liste de courses.' });
    }
  }
);

recipeRoutes.get('/favorites', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const favorites = await prisma.favorite.findMany({
    where: { userId: req.user!.id },
    include: { recipe: true },
    orderBy: { createdAt: 'desc' },
  });

  const recipes = favorites.map((f) => ({
    id: f.recipe.id,
    name: f.recipe.name,
    description: f.recipe.description ?? '',
    category: f.recipe.category,
    preparationTime: f.recipe.preparationTime,
    ingredients: f.recipe.ingredients,
    steps: f.recipe.steps,
    pricePerPerson: f.recipe.pricePerPerson,
    nutrition: f.recipe.nutrition,
  }));

  res.json({ success: true, data: { recipes } });
});

const favoriteBodySchema = z.object({ recipeId: z.string().min(1).max(30) });

recipeRoutes.post('/favorites', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const parsed = favoriteBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'recipeId invalide.' });
    return;
  }
  const { recipeId } = parsed.data;

  const exists = await prisma.recipe.findUnique({ where: { id: recipeId }, select: { id: true } });
  if (!exists) {
    res.status(404).json({ success: false, error: 'Recette introuvable.' });
    return;
  }

  await prisma.favorite.upsert({
    where: { userId_recipeId: { userId: req.user!.id, recipeId } },
    create: { userId: req.user!.id, recipeId },
    update: {},
  });

  res.status(201).json({ success: true });
});

recipeRoutes.delete('/favorites/:recipeId', requireAuth, async (req: Request, res: Response): Promise<void> => {
  await prisma.favorite.deleteMany({
    where: { userId: req.user!.id, recipeId: req.params.recipeId },
  });
  res.json({ success: true });
});
