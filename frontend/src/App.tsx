import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';
import { Header } from './components/Header';
import { MealSelector } from './components/MealSelector';
import { RecipeGrid } from './components/RecipeGrid';
import { ShoppingList } from './components/ShoppingList';
import { Spinner } from './components/ui/Spinner';
import { BrutalToaster } from './components/ui/BrutalToast';
import * as api from './lib/api';
import type {
  Recipe,
  GenerateRecipesRequest,
  ShoppingListResponse,
} from '@shared/index';

export default function App() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);
  const [isRegeneratingAll, setIsRegeneratingAll] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [shoppingList, setShoppingList] = useState<ShoppingListResponse | null>(null);
  const [lastRequest, setLastRequest] = useState<GenerateRecipesRequest | null>(null);

  const handleGenerate = useCallback(async (request: GenerateRecipesRequest) => {
    setIsGenerating(true);
    setRecipes([]);
    setShoppingList(null);
    setLastRequest(request);
    try {
      const result = await api.generateRecipes(request);
      setRecipes(result.recipes);
      toast.success(`${result.recipes.length} recettes générées !`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erreur lors de la génération'
      );
    } finally {
      setIsGenerating(false);
    }
  }, []);

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
        });
        setRecipes((prev) => {
          const updated = [...prev];
          updated[index] = result.recipe;
          return updated;
        });
        toast.success('Recette regénérée !');
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Erreur lors de la regénération'
        );
      } finally {
        setRegeneratingIndex(null);
      }
    },
    [lastRequest, recipes]
  );

  const handleRegenerateAll = useCallback(async () => {
    if (!lastRequest) return;
    setIsRegeneratingAll(true);
    setShoppingList(null);
    try {
      const result = await api.generateRecipes(lastRequest);
      setRecipes(result.recipes);
      toast.success('Toutes les recettes ont été regénérées !');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erreur lors de la regénération'
      );
    } finally {
      setIsRegeneratingAll(false);
    }
  }, [lastRequest]);

  const handleExportShoppingList = useCallback(async () => {
    if (recipes.length === 0 || !lastRequest) return;
    setIsExporting(true);
    try {
      const result = await api.generateShoppingList({
        recipes,
        personsCount: lastRequest.personsCount,
      });
      setShoppingList(result);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erreur lors de la génération de la liste'
      );
    } finally {
      setIsExporting(false);
    }
  }, [recipes, lastRequest]);

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
                onExportShoppingList={handleExportShoppingList}
                regeneratingIndex={regeneratingIndex}
                isRegeneratingAll={isRegeneratingAll}
                isExporting={isExporting}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {shoppingList && (
            <ShoppingList
              shoppingList={shoppingList}
              onClose={() => setShoppingList(null)}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
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
