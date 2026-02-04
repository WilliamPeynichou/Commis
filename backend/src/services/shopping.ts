import type {
  Recipe,
  ShoppingItem,
  ShoppingCategory,
  ShoppingListResponse,
} from '@recipe-planner/shared';

export function generateShoppingList(recipes: Recipe[]): ShoppingListResponse {
  const ingredientMap = new Map<string, ShoppingItem>();

  for (const recipe of recipes) {
    for (const ingredient of recipe.ingredients) {
      const key = `${ingredient.name.toLowerCase()}-${ingredient.unit}`;

      if (ingredientMap.has(key)) {
        const existing = ingredientMap.get(key)!;
        existing.totalQuantity += ingredient.quantity;
      } else {
        ingredientMap.set(key, {
          name: ingredient.name,
          totalQuantity: ingredient.quantity,
          unit: ingredient.unit,
          category: ingredient.category,
        });
      }
    }
  }

  const categories: Record<ShoppingCategory, ShoppingItem[]> = {
    'fruits-legumes': [],
    'viandes-poissons': [],
    'produits-laitiers': [],
    'epicerie': [],
    'boulangerie': [],
    'surgeles': [],
    'boissons': [],
    'condiments': [],
    'autre': [],
  };

  for (const item of ingredientMap.values()) {
    item.totalQuantity = Math.round(item.totalQuantity * 100) / 100;
    categories[item.category].push(item);
  }

  for (const cat of Object.keys(categories) as ShoppingCategory[]) {
    categories[cat].sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  }

  const totalEstimatedPrice = recipes.reduce(
    (sum, recipe) => sum + recipe.pricePerPerson,
    0
  );

  return {
    categories,
    totalEstimatedPrice: Math.round(totalEstimatedPrice * 100) / 100,
  };
}
