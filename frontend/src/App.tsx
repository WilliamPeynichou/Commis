import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';
import { Header } from './components/Header';
import { MealSelector } from './components/MealSelector';
import { RecipeGrid } from './components/RecipeGrid';
import { ShoppingList } from './components/ShoppingList';
import { StoreComparison } from './components/StoreComparison';
import { Spinner } from './components/ui/Spinner';
import { BrutalToaster } from './components/ui/BrutalToast';
import { AuthModal } from './components/AuthModal';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import * as api from './lib/api';
import { getFavorites, addFavorite, removeFavorite } from './lib/favoritesApi';
import type {
  Recipe,
  GenerateRecipesRequest,
  ShoppingListResponse,
} from '@shared/index';

function AppContent() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [favoritedIds, setFavoritedIds] = useState<Set<string>>(new Set());

  // Load favorite ids on mount / when user changes
  useEffect(() => {
    if (!user) { setFavoritedIds(new Set()); return; }
    getFavorites()
      .then((favs) => setFavoritedIds(new Set(favs.map((r) => r.id))))
      .catch(() => {});
  }, [user]);

  const handleToggleFavorite = useCallback(async (recipe: Recipe) => {
    if (favoritedIds.has(recipe.id)) {
      setFavoritedIds((prev) => { const s = new Set(prev); s.delete(recipe.id); return s; });
      try {
        await removeFavorite(recipe.id);
        toast.success('Retiré des favoris');
      } catch {
        setFavoritedIds((prev) => new Set([...prev, recipe.id]));
        toast.error('Impossible de retirer le favori');
      }
    } else {
      setFavoritedIds((prev) => new Set([...prev, recipe.id]));
      try {
        await addFavorite(recipe.id);
        toast.success('Ajouté aux favoris ♥');
      } catch {
        setFavoritedIds((prev) => { const s = new Set(prev); s.delete(recipe.id); return s; });
        toast.error('Impossible d\'ajouter le favori');
      }
    }
  }, [favoritedIds]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);
  const [isRegeneratingAll, setIsRegeneratingAll] = useState(false);
  const [shoppingList, setShoppingList] = useState<ShoppingListResponse | null>(null);
  const [lastRequest, setLastRequest] = useState<GenerateRecipesRequest | null>(null);
  // Accumulates ALL recipe names ever shown during the session so Claude never repeats them
  const [recipeHistory, setRecipeHistory] = useState<string[]>([]);

  function openAuth(tab: 'login' | 'register') {
    setAuthTab(tab);
    setShowAuth(true);
  }

  const refreshShoppingList = useCallback(async (updatedRecipes: Recipe[], personsCount: number) => {
    try {
      const result = await api.generateShoppingList({ recipes: updatedRecipes, personsCount });
      setShoppingList(result);
    } catch {
      // Shopping list update is non-critical, silently fail
    }
  }, []);

  const handleGenerate = useCallback(async (request: GenerateRecipesRequest) => {
    setIsGenerating(true);
    setRecipes([]);
    setShoppingList(null);
    setLastRequest(request);
    setRecipeHistory([]);
    try {
      const result = await api.generateRecipes(request);
      setRecipes(result.recipes);
      setRecipeHistory(result.recipes.map((r) => r.name));
      toast.success(`${result.recipes.length} recettes générées !`);
      await refreshShoppingList(result.recipes, request.personsCount);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erreur lors de la génération'
      );
    } finally {
      setIsGenerating(false);
    }
  }, [refreshShoppingList]);

  const handleRegenerateOne = useCallback(
    async (index: number) => {
      if (!lastRequest || !recipes[index]) return;
      setRegeneratingIndex(index);
      try {
        const result = await api.regenerateRecipe({
          index,
          category: recipes[index].category,
          personsCount: lastRequest.personsCount,
          excludedTags: lastRequest.excludedTags,
          timeFilter: lastRequest.timeFilter,
          healthy: lastRequest.healthy,
          freeText: lastRequest.freeText,
          currentRecipeName: recipes[index].name,
          existingRecipeNames: recipeHistory.filter((name) => name !== recipes[index].name),
        });
        const updated = [...recipes];
        updated[index] = result.recipe;
        setRecipes(updated);
        setRecipeHistory((prev) => [...new Set([...prev, result.recipe.name])]);
        toast.success('Recette regénérée !');
        await refreshShoppingList(updated, lastRequest.personsCount);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Erreur lors de la regénération'
        );
      } finally {
        setRegeneratingIndex(null);
      }
    },
    [lastRequest, recipes, recipeHistory, refreshShoppingList]
  );

  const handleRegenerateAll = useCallback(async () => {
    if (!lastRequest) return;
    setIsRegeneratingAll(true);
    setShoppingList(null);
    try {
      const result = await api.generateRecipes({
        ...lastRequest,
        previousRecipeNames: recipeHistory,
      });
      setRecipes(result.recipes);
      setRecipeHistory((prev) => [...new Set([...prev, ...result.recipes.map((r) => r.name)])]);
      toast.success('Toutes les recettes ont été regénérées !');
      await refreshShoppingList(result.recipes, lastRequest.personsCount);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erreur lors de la regénération'
      );
    } finally {
      setIsRegeneratingAll(false);
    }
  }, [lastRequest, recipeHistory, refreshShoppingList]);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <BrutalToaster />
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Spinner />
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <BrutalToaster />
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6 max-w-md"
          >
            <h1 className="text-4xl sm:text-5xl font-black text-deep-black tracking-tight">
              Commis
            </h1>
            <p className="text-deep-black/60 text-base sm:text-lg">
              Planifiez vos repas de la semaine et générez vos recettes avec l'IA.
              Connectez-vous pour commencer.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => openAuth('login')}
                className="px-6 py-3 bg-mauve border-2 border-deep-black text-deep-black font-bold shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 transition-transform"
              >
                Se connecter
              </button>
              <button
                onClick={() => openAuth('register')}
                className="px-6 py-3 bg-off-white border-2 border-deep-black text-deep-black font-bold shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 transition-transform"
              >
                Créer un compte
              </button>
            </div>
          </motion.div>
        </main>
        <AnimatePresence>
          {showAuth && (
            <AuthModal onClose={() => setShowAuth(false)} initialTab={authTab} />
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <BrutalToaster />
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">
        <MealSelector onGenerate={handleGenerate} isLoading={isGenerating} />

        <AnimatePresence mode="wait">
          {isGenerating && (
            <motion.div
              key="spinner"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Spinner />
            </motion.div>
          )}

          {!isGenerating && recipes.length > 0 && (
            <motion.div
              key="recipes"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <RecipeGrid
                recipes={recipes}
                onRegenerateOne={handleRegenerateOne}
                onRegenerateAll={handleRegenerateAll}
                regeneratingIndex={regeneratingIndex}
                isRegeneratingAll={isRegeneratingAll}
                favoritedIds={favoritedIds}
                onToggleFavorite={handleToggleFavorite}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {shoppingList && !isGenerating && (
            <motion.div
              key="shopping"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-12"
            >
              <ShoppingList shoppingList={shoppingList} />
              <StoreComparison totalEstimatedPrice={shoppingList.totalEstimatedPrice} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="border-t-2 border-deep-black/10 bg-off-white/80 backdrop-blur-sm mt-auto py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center gap-3">
          <div className="flex gap-1.5">
            {['#B19CD9', '#D96846', '#FFF4B5'].map((color) => (
              <span
                key={color}
                className="w-2.5 h-2.5 rounded-full border border-deep-black/20"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <p className="font-semibold text-deep-black/30 text-sm">
            Recipe Planner — Propulsé par Claude AI
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
