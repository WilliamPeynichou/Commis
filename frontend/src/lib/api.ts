import type {
  GenerateRecipesRequest,
  RegenerateRecipeRequest,
  ShoppingListRequest,
  ApiResponse,
  GenerateRecipesResponse,
  RegenerateRecipeResponse,
  ShoppingListResponse,
} from '@shared/index';

const API_BASE = '/api/recipes';

async function request<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data: ApiResponse<T> = await response.json();

  if (!data.success || !data.data) {
    throw new Error(data.error || 'Une erreur est survenue');
  }

  return data.data;
}

export async function generateRecipes(
  payload: GenerateRecipesRequest
): Promise<GenerateRecipesResponse> {
  return request<GenerateRecipesResponse>('/generate', payload);
}

export async function regenerateRecipe(
  payload: RegenerateRecipeRequest
): Promise<RegenerateRecipeResponse> {
  return request<RegenerateRecipeResponse>('/regenerate', payload);
}

export async function generateShoppingList(
  payload: ShoppingListRequest
): Promise<ShoppingListResponse> {
  return request<ShoppingListResponse>('/shopping-list', payload);
}
