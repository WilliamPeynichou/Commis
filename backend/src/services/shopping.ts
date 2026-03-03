import type {
  Recipe,
  ShoppingItem,
  ShoppingCategory,
  ShoppingListResponse,
} from '@recipe-planner/shared';

function normalizeUnit(unit: string): string {
  const u = unit.toLowerCase().trim();
  if (['gramme', 'grammes', 'gr', 'g'].includes(u)) return 'g';
  if (['kilogramme', 'kilogrammes', 'kilo', 'kilos', 'kg'].includes(u)) return 'kg';
  if (['millilitre', 'millilitres', 'ml'].includes(u)) return 'ml';
  if (['centilitre', 'centilitres', 'cl'].includes(u)) return 'cl';
  if (['décilitre', 'décilitres', 'dl'].includes(u)) return 'dl';
  if (['litre', 'litres', 'l'].includes(u)) return 'l';
  if (['cuillère à soupe', 'cuillères à soupe', 'c. à s.', 'c.à.s.', 'cas', 'cs'].includes(u)) return 'c. à s.';
  if (['cuillère à café', 'cuillères à café', 'c. à c.', 'c.à.c.', 'cac', 'cc'].includes(u)) return 'c. à c.';
  return u;
}

function getUnitFamily(normalizedUnit: string): 'mass' | 'volume' | 'other' {
  if (['g', 'kg'].includes(normalizedUnit)) return 'mass';
  if (['ml', 'cl', 'dl', 'l'].includes(normalizedUnit)) return 'volume';
  return 'other';
}

// Convert to base unit: grams for mass, ml for volume
function toBaseQuantity(quantity: number, normalizedUnit: string): number {
  switch (normalizedUnit) {
    case 'kg': return quantity * 1000;
    case 'cl': return quantity * 10;
    case 'dl': return quantity * 100;
    case 'l': return quantity * 1000;
    default: return quantity;
  }
}

function toDisplayUnit(baseQuantity: number, family: 'mass' | 'volume'): { quantity: number; unit: string } {
  if (family === 'mass') {
    if (baseQuantity >= 1000) return { quantity: baseQuantity / 1000, unit: 'kg' };
    return { quantity: baseQuantity, unit: 'g' };
  }
  // volume
  if (baseQuantity >= 1000) return { quantity: baseQuantity / 1000, unit: 'l' };
  if (baseQuantity >= 100) return { quantity: baseQuantity / 100, unit: 'cl' };
  return { quantity: baseQuantity, unit: 'ml' };
}

interface AggregatedItem {
  name: string;
  baseQuantity: number;
  family: 'mass' | 'volume' | 'other';
  normalizedUnit: string;
  category: ShoppingCategory;
}

export function generateShoppingList(recipes: Recipe[], personsCount: number): ShoppingListResponse {
  const ingredientMap = new Map<string, AggregatedItem>();

  for (const recipe of recipes) {
    for (const ingredient of recipe.ingredients) {
      const normalizedUnit = normalizeUnit(ingredient.unit);
      const family = getUnitFamily(normalizedUnit);
      const normalizedName = ingredient.name.toLowerCase().trim();

      // Group by name + unit family (mass/volume merge g with kg, ml with cl/l, etc.)
      // For other units, group by name + exact unit
      const key = family === 'other'
        ? `${normalizedName}|||${normalizedUnit}`
        : `${normalizedName}|||${family}`;

      const baseQty = toBaseQuantity(ingredient.quantity, normalizedUnit);

      if (ingredientMap.has(key)) {
        ingredientMap.get(key)!.baseQuantity += baseQty;
      } else {
        ingredientMap.set(key, {
          name: ingredient.name,
          baseQuantity: baseQty,
          family,
          normalizedUnit,
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
    let quantity: number;
    let unit: string;

    if (item.family === 'mass' || item.family === 'volume') {
      const display = toDisplayUnit(item.baseQuantity, item.family);
      quantity = display.quantity;
      unit = display.unit;
    } else {
      quantity = item.baseQuantity;
      unit = item.normalizedUnit;
    }

    categories[item.category].push({
      name: item.name,
      totalQuantity: Math.round(quantity * 100) / 100,
      unit,
      category: item.category,
    });
  }

  for (const cat of Object.keys(categories) as ShoppingCategory[]) {
    categories[cat].sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  }

  const totalEstimatedPrice = recipes.reduce(
    (sum, recipe) => sum + recipe.pricePerPerson * personsCount,
    0
  );

  return {
    categories,
    totalEstimatedPrice: Math.round(totalEstimatedPrice * 100) / 100,
  };
}
