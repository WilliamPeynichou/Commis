import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';

export const generateRecipesSchema = z.object({
  mealsCount: z.number().int().min(1).max(14),
  categories: z.object({
    economique: z.number().int().min(0),
    gourmand: z.number().int().min(0),
    plaisir: z.number().int().min(0),
  }),
  personsCount: z.number().int().min(1).max(10),
  excludedTags: z.array(z.string()),
}).refine(
  (data) =>
    data.categories.economique + data.categories.gourmand + data.categories.plaisir === data.mealsCount,
  {
    message: 'La somme des catégories doit être égale au nombre de repas',
  }
);

export const regenerateRecipeSchema = z.object({
  index: z.number().int().min(0),
  category: z.enum(['economique', 'gourmand', 'plaisir']),
  personsCount: z.number().int().min(1).max(10),
  excludedTags: z.array(z.string()),
});

export const shoppingListSchema = z.object({
  recipes: z.array(z.object({
    id: z.string(),
    name: z.string(),
    category: z.string(),
    preparationTime: z.number(),
    ingredients: z.array(z.object({
      name: z.string(),
      quantity: z.number(),
      unit: z.string(),
      category: z.string(),
    })),
    steps: z.array(z.string()),
    pricePerPerson: z.number(),
    nutrition: z.object({
      calories: z.number(),
      proteins: z.number(),
      carbs: z.number(),
      fats: z.number(),
      fiber: z.number(),
    }),
  })),
  personsCount: z.number().int().min(1).max(10),
});

export function validate(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        success: false,
        error: result.error.errors.map((e) => e.message).join(', '),
      });
      return;
    }
    next();
  };
}
