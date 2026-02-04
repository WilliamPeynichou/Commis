import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  RefreshCw,
  Euro,
  ChevronDown,
  ChevronUp,
  Flame,
  Beef,
  Wheat,
  Droplets,
  Leaf,
} from 'lucide-react';
import { BrutalBadge } from './ui/BrutalBadge';
import { BrutalButton } from './ui/BrutalButton';
import { use3DTilt } from '../hooks/use3DTilt';
import type { Recipe, RecipeCategory } from '@shared/index';
import { CATEGORY_LABELS } from '@shared/index';

interface RecipeCardProps {
  recipe: Recipe;
  index: number;
  onRegenerate: (index: number) => void;
  isRegenerating: boolean;
}

const categoryStyles: Record<
  RecipeCategory,
  {
    headerBg: string;
    headerText: string;
    badge: 'mauve' | 'orange' | 'yellow';
    stripColor: string;
    stepBg: string;
  }
> = {
  economique: {
    headerBg: 'bg-mauve',
    headerText: '',
    badge: 'mauve',
    stripColor: '#B19CD9',
    stepBg: 'bg-mauve-light',
  },
  gourmand: {
    headerBg: 'bg-dark-orange',
    headerText: 'text-white',
    badge: 'orange',
    stripColor: '#D96846',
    stepBg: 'bg-dark-orange-light',
  },
  plaisir: {
    headerBg: 'bg-pale-yellow',
    headerText: '',
    badge: 'yellow',
    stripColor: '#FFF4B5',
    stepBg: 'bg-pale-yellow',
  },
};

const nutritionIcons = [
  { key: 'calories', label: 'Cal', unit: '', icon: Flame, color: 'text-dark-orange' },
  { key: 'proteins', label: 'Prot', unit: 'g', icon: Beef, color: 'text-mauve-dark' },
  { key: 'carbs', label: 'Gluc', unit: 'g', icon: Wheat, color: 'text-dark-orange-light' },
  { key: 'fats', label: 'Lip', unit: 'g', icon: Droplets, color: 'text-sky' },
  { key: 'fiber', label: 'Fib', unit: 'g', icon: Leaf, color: 'text-mint' },
] as const;

export function RecipeCard({ recipe, index, onRegenerate, isRegenerating }: RecipeCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const { ref, style, glareStyle, handlers } = use3DTilt({ maxTilt: 6, scale: 1.02 });
  const catStyle = categoryStyles[recipe.category];

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, rotateY: -10 }}
      animate={{ opacity: 1, y: 0, rotateY: 0 }}
      transition={{
        type: 'spring',
        stiffness: 200,
        damping: 22,
        delay: index * 0.07,
      }}
      className="perspective-container"
    >
      <div
        ref={ref}
        style={{
          ...style,
          transformStyle: 'preserve-3d',
        }}
        {...handlers}
        className="relative"
      >
        {/* Glare overlay */}
        <div style={glareStyle} className="rounded-3xl" />

        <AnimatePresence mode="wait">
          {!isFlipped ? (
            /* ===== FRONT FACE ===== */
            <motion.div
              key="front"
              initial={false}
              className="card-brutal overflow-hidden flex flex-col relative"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Side color strip */}
              <div
                className="absolute left-0 top-0 bottom-0 w-1.5 z-10 rounded-l-3xl"
                style={{ backgroundColor: catStyle.stripColor }}
              />

              {/* Header */}
              <div className={`px-6 py-5 ${catStyle.headerBg} ${catStyle.headerText} relative`}>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-bold text-lg leading-snug pr-2 flex-1">
                    {recipe.name}
                  </h3>
                  <BrutalBadge variant={catStyle.badge}>
                    {CATEGORY_LABELS[recipe.category]}
                  </BrutalBadge>
                </div>

                <div className="flex items-center gap-4 mt-3">
                  <span className="flex items-center gap-1.5 text-sm font-semibold">
                    <Clock size={15} strokeWidth={2.5} />
                    {recipe.preparationTime} min
                  </span>
                  <span className="flex items-center gap-1.5 text-sm font-semibold">
                    <Euro size={15} strokeWidth={2.5} />
                    {recipe.pricePerPerson.toFixed(2)}€/pers.
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 flex-1 flex flex-col gap-5">
                {/* Ingredients preview as chips */}
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-widest text-deep-black/40 mb-3">
                    Ingrédients
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {recipe.ingredients.slice(0, 6).map((ing, i) => (
                      <span
                        key={i}
                        className="text-xs font-medium bg-pale-yellow/60 border border-deep-black/10 rounded-full px-2.5 py-1"
                      >
                        {ing.name}
                      </span>
                    ))}
                    {recipe.ingredients.length > 6 && (
                      <span className="text-xs font-bold text-deep-black/30 px-2 py-1">
                        +{recipe.ingredients.length - 6}
                      </span>
                    )}
                  </div>
                </div>

                {/* Expandable steps */}
                <div>
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center gap-2 font-bold text-xs uppercase tracking-widest text-deep-black/40 hover:text-deep-black/70 transition-colors w-full"
                  >
                    Préparation ({recipe.steps.length} étapes)
                    {isExpanded ? (
                      <ChevronUp size={14} strokeWidth={3} />
                    ) : (
                      <ChevronDown size={14} strokeWidth={3} />
                    )}
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                        className="overflow-hidden"
                      >
                        <ol className="space-y-3 mt-3">
                          {recipe.steps.map((step, i) => (
                            <motion.li
                              key={i}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.05 }}
                              className="flex gap-3"
                            >
                              <span
                                className="flex-shrink-0 w-7 h-7 rounded-lg border-2 border-deep-black flex items-center justify-center font-bold text-xs"
                                style={{
                                  backgroundColor: catStyle.stripColor,
                                  boxShadow: '0 2px 0 0 rgba(26,26,26,0.4)',
                                }}
                              >
                                {i + 1}
                              </span>
                              <p className="text-sm leading-relaxed text-deep-black/80 pt-0.5">
                                {step}
                              </p>
                            </motion.li>
                          ))}
                        </ol>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Nutrition mini bar */}
                <div className="grid grid-cols-5 gap-1.5 mt-auto pt-3">
                  {nutritionIcons.map((n) => {
                    const Icon = n.icon;
                    const value = recipe.nutrition[n.key as keyof typeof recipe.nutrition];
                    return (
                      <div
                        key={n.key}
                        className="flex flex-col items-center gap-1 p-2 rounded-xl bg-off-white border border-deep-black/8 hover:border-deep-black/20 transition-colors cursor-default group"
                      >
                        <Icon
                          size={14}
                          strokeWidth={2.5}
                          className={`${n.color} group-hover:scale-110 transition-transform`}
                        />
                        <span className="font-bold text-xs leading-none">
                          {value}{n.unit}
                        </span>
                        <span className="text-[9px] uppercase font-semibold text-deep-black/30 leading-none">
                          {n.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <BrutalButton
                    variant="mauve"
                    size="sm"
                    onClick={() => onRegenerate(index)}
                    isLoading={isRegenerating}
                    className="flex-1"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <RefreshCw size={14} strokeWidth={3} />
                      Regénérer
                    </span>
                  </BrutalButton>

                  <button
                    onClick={() => setIsFlipped(true)}
                    className="w-11 h-11 rounded-2xl border-2 border-deep-black/15 bg-off-white flex items-center justify-center hover:bg-pale-yellow/50 transition-colors"
                    title="Voir les détails"
                    style={{ boxShadow: '0 3px 0 0 rgba(26,26,26,0.15)' }}
                  >
                    <span className="text-sm font-bold">i</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            /* ===== BACK FACE (Details) ===== */
            <motion.div
              key="back"
              initial={{ opacity: 0, rotateY: 90 }}
              animate={{ opacity: 1, rotateY: 0 }}
              exit={{ opacity: 0, rotateY: -90 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="card-brutal overflow-hidden flex flex-col"
            >
              <div className="px-6 py-4 bg-deep-black text-white flex items-center justify-between">
                <h3 className="font-bold text-base truncate pr-3">{recipe.name}</h3>
                <button
                  onClick={() => setIsFlipped(false)}
                  className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors text-sm font-bold"
                >
                  &times;
                </button>
              </div>

              <div className="p-6 flex-1 overflow-y-auto space-y-5 max-h-[500px]">
                {/* Full ingredients */}
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-widest text-deep-black/40 mb-3">
                    Tous les ingrédients
                  </h4>
                  <ul className="space-y-2">
                    {recipe.ingredients.map((ing, i) => (
                      <li
                        key={i}
                        className="flex justify-between items-center py-1.5 px-3 rounded-xl hover:bg-pale-yellow/30 transition-colors"
                      >
                        <span className="font-medium text-sm">{ing.name}</span>
                        <span className="font-mono text-xs text-deep-black/50 bg-pale-yellow/50 px-2.5 py-1 rounded-lg">
                          {ing.quantity} {ing.unit}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Full steps */}
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-widest text-deep-black/40 mb-3">
                    Toutes les étapes
                  </h4>
                  <ol className="space-y-3">
                    {recipe.steps.map((step, i) => (
                      <li key={i} className="flex gap-3">
                        <span
                          className="flex-shrink-0 w-7 h-7 rounded-lg border-2 border-deep-black flex items-center justify-center font-bold text-xs"
                          style={{
                            backgroundColor: catStyle.stripColor,
                            boxShadow: '0 2px 0 0 rgba(26,26,26,0.4)',
                          }}
                        >
                          {i + 1}
                        </span>
                        <p className="text-sm leading-relaxed text-deep-black/80 pt-0.5">
                          {step}
                        </p>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Detailed nutrition */}
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-widest text-deep-black/40 mb-3">
                    Valeurs nutritionnelles
                  </h4>
                  <div className="space-y-2">
                    {nutritionIcons.map((n) => {
                      const Icon = n.icon;
                      const value = recipe.nutrition[n.key as keyof typeof recipe.nutrition];
                      return (
                        <div
                          key={n.key}
                          className="flex items-center justify-between py-2 px-3 rounded-xl bg-off-white border border-deep-black/6"
                        >
                          <div className="flex items-center gap-2">
                            <Icon size={16} strokeWidth={2.5} className={n.color} />
                            <span className="text-sm font-medium">{n.label}</span>
                          </div>
                          <span className="font-bold text-sm">
                            {value}{n.unit}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
