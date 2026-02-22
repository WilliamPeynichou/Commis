import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, ShoppingBag, Check } from 'lucide-react';
import { BrutalButton } from './ui/BrutalButton';
import type { ShoppingListResponse, ShoppingCategory } from '@shared/index';
import { SHOPPING_CATEGORY_LABELS } from '@shared/index';

interface ShoppingListProps {
  shoppingList: ShoppingListResponse;
}

const categoryIcons: Record<ShoppingCategory, string> = {
  'fruits-legumes': '🥕',
  'viandes-poissons': '🥩',
  'produits-laitiers': '🧀',
  'epicerie': '🫘',
  'boulangerie': '🥖',
  'surgeles': '🧊',
  'boissons': '🥤',
  'condiments': '🧂',
  'autre': '📦',
};

export function ShoppingList({ shoppingList }: ShoppingListProps) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const nonEmptyCategories = (
    Object.entries(shoppingList.categories) as [ShoppingCategory, typeof shoppingList.categories[ShoppingCategory]][]
  ).filter(([, items]) => items.length > 0);

  const totalItems = nonEmptyCategories.reduce((sum, [, items]) => sum + items.length, 0);
  const checkedCount = checkedItems.size;

  const toggleItem = (key: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleDownload = () => {
    let text = 'LISTE DE COURSES\n';
    text += '='.repeat(40) + '\n\n';

    for (const [cat, items] of nonEmptyCategories) {
      text += `${categoryIcons[cat]} ${SHOPPING_CATEGORY_LABELS[cat]}\n`;
      text += '-'.repeat(30) + '\n';
      for (const item of items) {
        text += `  - ${item.name}: ${item.totalQuantity} ${item.unit}\n`;
      }
      text += '\n';
    }

    text += `\nPrix total estimé: ${shoppingList.totalEstimatedPrice.toFixed(2)} EUR\n`;

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'liste-de-courses.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      className="section-brutal space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <motion.div
            whileHover={{ rotate: -10 }}
            className="bg-mauve p-3 rounded-2xl border-3 border-deep-black"
            style={{ boxShadow: '0 4px 0 0 rgba(26,26,26,0.6)' }}
          >
            <ShoppingBag size={24} strokeWidth={2.5} />
          </motion.div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Liste de courses</h2>
            <p className="text-sm text-deep-black/40 mt-0.5">
              {checkedCount > 0
                ? `${checkedCount} / ${totalItems} articles cochés`
                : `${totalItems} article${totalItems > 1 ? 's' : ''} à acheter`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Progress pill */}
          {totalItems > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-off-white border-2 border-deep-black/15 rounded-2xl">
              <div className="w-24 h-2 bg-deep-black/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-mint rounded-full"
                  animate={{ width: `${(checkedCount / totalItems) * 100}%` }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                />
              </div>
              <span className="text-xs font-bold text-deep-black/50">
                {Math.round((checkedCount / totalItems) * 100)}%
              </span>
            </div>
          )}
          <BrutalButton variant="mauve" size="md" onClick={handleDownload}>
            <span className="flex items-center gap-2">
              <Download size={16} strokeWidth={3} />
              Télécharger
            </span>
          </BrutalButton>
        </div>
      </div>

      {/* Price summary */}
      <div className="flex items-center gap-4 px-5 py-4 bg-pale-yellow/50 rounded-2xl border-2 border-deep-black/10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-deep-black/40">
            Prix total estimé
          </p>
          <p className="text-3xl font-bold text-dark-orange">
            {shoppingList.totalEstimatedPrice.toFixed(2)}€
          </p>
        </div>
      </div>

      {/* Categories grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {nonEmptyCategories.map(([cat, items], catIndex) => (
          <motion.div
            key={cat}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: catIndex * 0.05 }}
            className="bg-white rounded-2xl border-2 border-deep-black/10 overflow-hidden"
            style={{ boxShadow: '0 3px 0 0 rgba(26,26,26,0.08)' }}
          >
            {/* Category header */}
            <div className="flex items-center justify-between px-4 py-3 bg-off-white border-b border-deep-black/8">
              <h3 className="font-bold text-sm flex items-center gap-2 text-deep-black/70">
                <span className="text-base">{categoryIcons[cat]}</span>
                {SHOPPING_CATEGORY_LABELS[cat]}
              </h3>
              <span className="badge-float bg-pale-yellow text-deep-black text-[10px] py-0.5 px-2">
                {items.length}
              </span>
            </div>

            {/* Items */}
            <div className="divide-y divide-deep-black/5">
              {items.map((item, i) => {
                const key = `${cat}-${item.name}-${i}`;
                const isChecked = checkedItems.has(key);
                return (
                  <button
                    key={i}
                    onClick={() => toggleItem(key)}
                    className={`w-full flex justify-between items-center py-2.5 px-4 transition-colors text-left
                      ${isChecked ? 'bg-mint/20' : 'hover:bg-pale-yellow/20'}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-all
                          ${isChecked ? 'bg-deep-black border-deep-black' : 'border-deep-black/30'}`}
                      >
                        {isChecked && <Check size={10} strokeWidth={3} className="text-white" />}
                      </div>
                      <span
                        className={`font-medium text-sm truncate transition-colors
                          ${isChecked ? 'line-through text-deep-black/30' : 'text-deep-black/80'}`}
                      >
                        {item.name}
                      </span>
                    </div>
                    <span
                      className={`font-mono text-xs ml-2 shrink-0 px-2 py-0.5 rounded-lg transition-colors
                        ${isChecked ? 'text-deep-black/20 bg-deep-black/5' : 'text-deep-black/40 bg-pale-yellow/50'}`}
                    >
                      {item.totalQuantity} {item.unit}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
