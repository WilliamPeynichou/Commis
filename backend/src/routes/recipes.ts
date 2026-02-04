import { Router } from 'express';
import type { Request, Response } from 'express';
import { generateRecipes, regenerateRecipe } from '../services/claude';
import { generateShoppingList } from '../services/shopping';
import {
  validate,
  generateRecipesSchema,
  regenerateRecipeSchema,
  shoppingListSchema,
} from '../middleware/validation';

export const recipeRoutes = Router();

recipeRoutes.post(
  '/generate',
  validate(generateRecipesSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const recipes = await generateRecipes(req.body);
      res.json({ success: true, data: { recipes } });
    } catch (error) {
      console.error('Error generating recipes:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la génération des recettes',
      });
    }
  }
);

recipeRoutes.post(
  '/regenerate',
  validate(regenerateRecipeSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const recipe = await regenerateRecipe(req.body);
      res.json({ success: true, data: { recipe } });
    } catch (error) {
      console.error('Error regenerating recipe:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la regénération de la recette',
      });
    }
  }
);

recipeRoutes.post(
  '/shopping-list',
  validate(shoppingListSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const shoppingList = generateShoppingList(req.body.recipes);
      res.json({ success: true, data: shoppingList });
    } catch (error) {
      console.error('Error generating shopping list:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la génération de la liste de courses',
      });
    }
  }
);
