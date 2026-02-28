import { Router } from 'express';
import type { Request, Response } from 'express';
import { generateRecipes, regenerateRecipe } from '../services/claude';
import { generateShoppingList } from '../services/shopping';
import { getSessionHistory, saveToHistory } from '../services/historyService';
import {
  validate,
  generateRecipesSchema,
  regenerateRecipeSchema,
  shoppingListSchema,
} from '../middleware/validation';

export const recipeRoutes = Router();

/** Extracts and validates the X-Session-Id header (must be a UUID v4). */
function extractSessionId(req: Request): string | null {
  const raw = req.headers['x-session-id'];
  const id = Array.isArray(raw) ? raw[0] : raw;
  if (!id) return null;
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return UUID_RE.test(id) ? id : null;
}

recipeRoutes.post(
  '/generate',
  validate(generateRecipesSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const sessionId = extractSessionId(req);

      // Merge DB history with any names the frontend already tracks in-session
      const dbHistory = sessionId ? await getSessionHistory(sessionId) : [];
      const merged = [...new Set([...dbHistory, ...(req.body.previousRecipeNames ?? [])])];

      const recipes = await generateRecipes({ ...req.body, previousRecipeNames: merged });

      // Persist new names for future sessions (fire-and-forget)
      if (sessionId) {
        void saveToHistory(
          recipes.map((r) => ({ name: r.name, category: r.category })),
          sessionId
        );
      }

      res.json({ success: true, data: { recipes } });
    } catch (error) {
      console.error('[/generate]', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la génération des recettes.',
      });
    }
  }
);

recipeRoutes.post(
  '/regenerate',
  validate(regenerateRecipeSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const sessionId = extractSessionId(req);

      // Merge DB history with names already known by the frontend
      const dbHistory = sessionId ? await getSessionHistory(sessionId) : [];
      const merged = [...new Set([...dbHistory, ...(req.body.existingRecipeNames ?? [])])];

      const recipe = await regenerateRecipe({ ...req.body, existingRecipeNames: merged });

      if (sessionId) {
        void saveToHistory([{ name: recipe.name, category: recipe.category }], sessionId);
      }

      res.json({ success: true, data: { recipe } });
    } catch (error) {
      console.error('[/regenerate]', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la regénération de la recette.',
      });
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
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la génération de la liste de courses.',
      });
    }
  }
);
