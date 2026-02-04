import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, ShoppingCart, Sparkles } from 'lucide-react';
import { RecipeCard } from './RecipeCard';
import { BrutalButton } from './ui/BrutalButton';
import type { Recipe } from '@shared/index';

interface RecipeGridProps {
  recipes: Recipe[];
  onRegenerateOne: (index: number) => void;
  onRegenerateAll: () => void;
  onExportShoppingList: () => void;
  regeneratingIndex: number | null;
  isRegeneratingAll: boolean;
  isExporting: boolean;
}

export function RecipeGrid({
  recipes,
  onRegenerateOne,
  onRegenerateAll,
  onExportShoppingList,
  regeneratingIndex,
  isRegeneratingAll,
  isExporting,
}: RecipeGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (gridRef.current) {
      gridRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const getGridClass = () => {
    const count = recipes.length;
    if (count === 1) return 'grid-cols-1 max-w-lg mx-auto';
    if (count === 2) return 'grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto';
    if (count <= 4) return 'grid-cols-1 md:grid-cols-2';
    if (count <= 6) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
  };

  return (
    <motion.div
      ref={gridRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      {/* Action bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-mauve p-2.5 rounded-2xl border-3 border-deep-black"
            style={{ boxShadow: '0 4px 0 0 rgba(26,26,26,0.6)' }}
          >
            <Sparkles size={20} strokeWidth={2.5} />
          </motion.div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-deep-black tracking-tight">
              Vos {recipes.length} recettes
            </h2>
            <p className="text-xs text-deep-black/40 font-medium mt-0.5">
              Survolez les cartes pour l'effet 3D — cliquez "i" pour les détails
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <BrutalButton
            variant="mauve"
            size="md"
            onClick={onRegenerateAll}
            isLoading={isRegeneratingAll}
          >
            <span className="flex items-center gap-2">
              <RefreshCw size={16} strokeWidth={3} />
              Tout regénérer
            </span>
          </BrutalButton>

          <BrutalButton
            variant="orange"
            size="md"
            onClick={onExportShoppingList}
            isLoading={isExporting}
          >
            <span className="flex items-center gap-2">
              <ShoppingCart size={16} strokeWidth={3} />
              Liste de courses
            </span>
          </BrutalButton>
        </div>
      </motion.div>

      {/* Recipe grid with staggered asymmetric layout */}
      <div className={`grid ${getGridClass()} gap-6 lg:gap-8`}>
        {recipes.map((recipe, index) => (
          <div
            key={recipe.id || index}
            className={
              index % 3 === 1 ? 'lg:mt-8' : index % 3 === 2 ? 'lg:mt-4' : ''
            }
          >
            <RecipeCard
              recipe={recipe}
              index={index}
              onRegenerate={onRegenerateOne}
              isRegenerating={regeneratingIndex === index}
            />
          </div>
        ))}
      </div>
    </motion.div>
  );
}
