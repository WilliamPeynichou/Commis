import type { Recipe } from '@shared/index';

const BASE = '/api/recipes/favorites';

async function req<T = void>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Erreur inattendue');
  return data.data as T;
}

export async function getFavorites(): Promise<Recipe[]> {
  const data = await req<{ recipes: Recipe[] }>(BASE);
  return data.recipes;
}

export async function addFavorite(recipeId: string): Promise<void> {
  await req(BASE, { method: 'POST', body: JSON.stringify({ recipeId }) });
}

export async function removeFavorite(recipeId: string): Promise<void> {
  await req(`${BASE}/${recipeId}`, { method: 'DELETE' });
}
