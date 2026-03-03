import type { Diet } from '@shared/index';

export async function getDiets(): Promise<Diet[]> {
  const res = await fetch('/api/diets', { credentials: 'include' });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Erreur inattendue');
  return (data.data?.diets ?? []) as Diet[];
}
