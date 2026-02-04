import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChefHat, Users, Minus, Plus, Sparkles, UtensilsCrossed } from 'lucide-react';
import { BrutalButton } from './ui/BrutalButton';
import { BrutalSlider } from './ui/BrutalSlider';
import { ExclusionTags } from './ExclusionTags';
import type { GenerateRecipesRequest, CategoryDistribution } from '@shared/index';

interface MealSelectorProps {
  onGenerate: (request: GenerateRecipesRequest) => void;
  isLoading: boolean;
}

function NumberStepper({
  value,
  min,
  max,
  onChange,
  color,
  label,
  icon,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  color: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      <span className="font-bold text-xs uppercase tracking-widest text-deep-black/50 flex items-center gap-1.5">
        {icon}
        {label}
      </span>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className={`stepper-btn ${color} disabled:opacity-30 disabled:cursor-not-allowed`}
        >
          <Minus size={20} strokeWidth={3} />
        </button>

        <motion.div
          key={value}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          className={`w-20 h-20 rounded-3xl border-3 border-deep-black ${color} flex items-center justify-center`}
          style={{ boxShadow: '0 6px 0 0 rgba(26, 26, 26, 0.6)' }}
        >
          <span className="text-4xl font-bold">{value}</span>
        </motion.div>

        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className={`stepper-btn ${color} disabled:opacity-30 disabled:cursor-not-allowed`}
        >
          <Plus size={20} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}

export function MealSelector({ onGenerate, isLoading }: MealSelectorProps) {
  const [mealsCount, setMealsCount] = useState(7);
  const [personsCount, setPersonsCount] = useState(2);
  const [categories, setCategories] = useState<CategoryDistribution>({
    economique: 3,
    gourmand: 3,
    plaisir: 1,
  });
  const [excludedTags, setExcludedTags] = useState<string[]>([]);

  const totalCategories = categories.economique + categories.gourmand + categories.plaisir;
  const isValid = totalCategories === mealsCount;

  useEffect(() => {
    const eco = Math.ceil(mealsCount * 0.4);
    const gour = Math.ceil(mealsCount * 0.4);
    const plai = mealsCount - eco - gour;
    setCategories({
      economique: Math.max(0, eco),
      gourmand: Math.max(0, gour),
      plaisir: Math.max(0, plai),
    });
  }, [mealsCount]);

  const updateCategory = useCallback(
    (key: keyof CategoryDistribution, value: number) => {
      setCategories((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleSubmit = () => {
    if (!isValid) return;
    onGenerate({ mealsCount, categories, personsCount, excludedTags });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.1 }}
      className="section-brutal space-y-10"
    >
      {/* Section Header */}
      <div className="flex items-center gap-4">
        <motion.div
          whileHover={{ rotate: 15 }}
          className="bg-pale-yellow p-3 rounded-2xl border-3 border-deep-black"
          style={{ boxShadow: '0 4px 0 0 rgba(26, 26, 26, 0.6)' }}
        >
          <UtensilsCrossed size={24} strokeWidth={2.5} />
        </motion.div>
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Configurez vos repas</h2>
          <p className="text-sm text-deep-black/40 mt-0.5">Personnalisez votre planning hebdomadaire</p>
        </div>
      </div>

      {/* Number steppers row */}
      <div className="flex flex-wrap justify-center gap-8 sm:gap-16 py-4">
        <NumberStepper
          value={mealsCount}
          min={1}
          max={14}
          onChange={setMealsCount}
          color="bg-mauve"
          label="Repas"
          icon={<ChefHat size={12} strokeWidth={3} />}
        />
        <NumberStepper
          value={personsCount}
          min={1}
          max={10}
          onChange={setPersonsCount}
          color="bg-dark-orange text-white"
          label="Personnes"
          icon={<Users size={12} strokeWidth={3} />}
        />
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-0.5 bg-deep-black/10 rounded-full" />
        <span className="text-xs font-bold uppercase tracking-widest text-deep-black/30">
          Répartition
        </span>
        <div className="flex-1 h-0.5 bg-deep-black/10 rounded-full" />
      </div>

      {/* Category Sliders */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-bold text-sm uppercase tracking-wide text-deep-black/60">
            Budget par catégorie
          </span>
          <AnimatePresence mode="wait">
            <motion.span
              key={`${totalCategories}-${mealsCount}`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className={`badge-float ${
                isValid ? 'bg-mint text-deep-black' : 'bg-dark-orange text-white'
              }`}
            >
              {totalCategories} / {mealsCount}
            </motion.span>
          </AnimatePresence>
        </div>

        <BrutalSlider
          label="Économique"
          value={categories.economique}
          min={0}
          max={mealsCount}
          onChange={(v) => updateCategory('economique', v)}
          color="mauve"
          budgetLabel="< 5€/pers."
        />

        <BrutalSlider
          label="Gourmand"
          value={categories.gourmand}
          min={0}
          max={mealsCount}
          onChange={(v) => updateCategory('gourmand', v)}
          color="orange"
          budgetLabel="5-10€/pers."
        />

        <BrutalSlider
          label="Plaisir"
          value={categories.plaisir}
          min={0}
          max={mealsCount}
          onChange={(v) => updateCategory('plaisir', v)}
          color="yellow"
          budgetLabel="> 10€/pers."
        />

        <AnimatePresence>
          {!isValid && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              className="overflow-hidden"
            >
              <p className="text-dark-orange font-bold text-sm bg-dark-orange/8 border-2 border-dark-orange/30 rounded-2xl px-5 py-3">
                La somme ({totalCategories}) doit correspondre au nombre de repas ({mealsCount})
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-0.5 bg-deep-black/10 rounded-full" />
        <span className="text-xs font-bold uppercase tracking-widest text-deep-black/30">
          Restrictions
        </span>
        <div className="flex-1 h-0.5 bg-deep-black/10 rounded-full" />
      </div>

      {/* Exclusion Tags */}
      <ExclusionTags
        tags={excludedTags}
        onAdd={(tag) => setExcludedTags((prev) => [...prev, tag])}
        onRemove={(tag) => setExcludedTags((prev) => prev.filter((t) => t !== tag))}
      />

      {/* Submit */}
      <BrutalButton
        variant="orange"
        size="lg"
        onClick={handleSubmit}
        disabled={!isValid}
        isLoading={isLoading}
        className="w-full text-lg sm:text-xl"
      >
        <span className="flex items-center justify-center gap-3">
          <Sparkles size={22} strokeWidth={2.5} />
          Générer mes recettes
          <Sparkles size={22} strokeWidth={2.5} />
        </span>
      </BrutalButton>
    </motion.div>
  );
}
