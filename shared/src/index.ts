// ==========================================
// Shared Types for Recipe Planner App
// ==========================================

// --- Recipe Types ---

export type RecipeCategory = 'economique' | 'gourmand' | 'plaisir';

export interface NutritionInfo {
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
  fiber: number;
}

export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
  category: ShoppingCategory;
}

export interface Recipe {
  id: string;
  name: string;
  category: RecipeCategory;
  preparationTime: number;
  ingredients: Ingredient[];
  steps: string[];
  pricePerPerson: number;
  nutrition: NutritionInfo;
}

// --- API Request Types ---

export interface CategoryDistribution {
  economique: number;
  gourmand: number;
  plaisir: number;
}

export interface GenerateRecipesRequest {
  mealsCount: number;
  categories: CategoryDistribution;
  personsCount: number;
  excludedTags: string[];
}

export interface RegenerateRecipeRequest {
  index: number;
  category: RecipeCategory;
  personsCount: number;
  excludedTags: string[];
}

export interface ShoppingListRequest {
  recipes: Recipe[];
  personsCount: number;
}

// --- API Response Types ---

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface GenerateRecipesResponse {
  recipes: Recipe[];
}

export interface RegenerateRecipeResponse {
  recipe: Recipe;
}

export type ShoppingCategory =
  | 'fruits-legumes'
  | 'viandes-poissons'
  | 'produits-laitiers'
  | 'epicerie'
  | 'boulangerie'
  | 'surgeles'
  | 'boissons'
  | 'condiments'
  | 'autre';

export interface ShoppingItem {
  name: string;
  totalQuantity: number;
  unit: string;
  category: ShoppingCategory;
}

export interface ShoppingListResponse {
  categories: Record<ShoppingCategory, ShoppingItem[]>;
  totalEstimatedPrice: number;
}

// --- Common Tags ---

export const COMMON_EXCLUSION_TAGS = [
  'gluten',
  'lactose',
  'arachides',
  'fruits à coque',
  'oeufs',
  'poisson',
  'crustacés',
  'soja',
  'céleri',
  'moutarde',
  'sésame',
  'lupin',
  'mollusques',
  'sulfites',
  'porc',
  'boeuf',
  'alcool',
  'végétarien',
  'végan',
] as const;

export const SHOPPING_CATEGORY_LABELS: Record<ShoppingCategory, string> = {
  'fruits-legumes': 'Fruits & Légumes',
  'viandes-poissons': 'Viandes & Poissons',
  'produits-laitiers': 'Produits Laitiers',
  'epicerie': 'Épicerie',
  'boulangerie': 'Boulangerie',
  'surgeles': 'Surgelés',
  'boissons': 'Boissons',
  'condiments': 'Condiments & Épices',
  'autre': 'Autre',
};

export const CATEGORY_LABELS: Record<RecipeCategory, string> = {
  economique: 'Économique',
  gourmand: 'Gourmand',
  plaisir: 'Plaisir',
};

export const CATEGORY_BUDGET: Record<RecipeCategory, string> = {
  economique: '< 5€/pers.',
  gourmand: '5-10€/pers.',
  plaisir: '> 10€/pers.',
};
