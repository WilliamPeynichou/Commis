import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, ShoppingBag } from 'lucide-react';
import { BrutalButton } from './ui/BrutalButton';
import type { ShoppingListResponse, ShoppingCategory } from '@shared/index';
import { SHOPPING_CATEGORY_LABELS } from '@shared/index';

interface ShoppingListProps {
  shoppingList: ShoppingListResponse;
  onClose: () => void;
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

export function ShoppingList({ shoppingList, onClose }: ShoppingListProps) {
  const nonEmptyCategories = (
    Object.entries(shoppingList.categories) as [ShoppingCategory, typeof shoppingList.categories[ShoppingCategory]][]
  ).filter(([, items]) => items.length > 0);

  const totalItems = nonEmptyCategories.reduce((sum, [, items]) => sum + items.length, 0);

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

    text += `\nPrix total estime: ${shoppingList.totalEstimatedPrice.toFixed(2)} EUR\n`;

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'liste-de-courses.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-deep-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
        onClick={onClose}
      >
        {/* Panel — slides up on mobile, centered on desktop */}
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="bg-off-white border-3 border-deep-black rounded-t-3xl sm:rounded-3xl w-full sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
          style={{
            boxShadow: '0 -8px 40px rgba(26,26,26,0.1), 0 24px 80px rgba(26,26,26,0.08)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-5 bg-mauve flex items-center justify-between border-b-3 border-deep-black">
            <div className="flex items-center gap-3">
              <div
                className="bg-off-white p-2 rounded-xl border-2 border-deep-black"
                style={{ boxShadow: '0 3px 0 0 rgba(26,26,26,0.5)' }}
              >
                <ShoppingBag size={20} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-xl font-bold">Liste de courses</h2>
                <p className="text-xs font-medium text-deep-black/50">
                  {totalItems} article{totalItems > 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl border-2 border-deep-black bg-off-white flex items-center justify-center hover:bg-pale-yellow transition-colors"
              style={{ boxShadow: '0 3px 0 0 rgba(26,26,26,0.5)' }}
            >
              <X size={18} strokeWidth={3} />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto flex-1 p-6 space-y-5">
            {nonEmptyCategories.map(([cat, items], catIndex) => (
              <motion.div
                key={cat}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: catIndex * 0.04 }}
              >
                <h3 className="font-bold text-sm mb-3 flex items-center gap-2 text-deep-black/60 uppercase tracking-wide">
                  <span className="text-base">{categoryIcons[cat]}</span>
                  {SHOPPING_CATEGORY_LABELS[cat]}
                  <span className="ml-auto badge-float bg-pale-yellow text-deep-black text-[10px] py-0.5 px-2">
                    {items.length}
                  </span>
                </h3>
                <div className="space-y-1">
                  {items.map((item, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center py-2 px-4 rounded-xl hover:bg-pale-yellow/30 transition-colors group"
                    >
                      <span className="font-medium text-sm group-hover:text-deep-black">
                        {item.name}
                      </span>
                      <span className="font-mono text-xs text-deep-black/40 bg-white border border-deep-black/8 rounded-lg px-2.5 py-1">
                        {item.totalQuantity} {item.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t-3 border-deep-black bg-pale-yellow/50 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-deep-black/40">
                Total estimé
              </p>
              <p className="text-2xl font-bold text-dark-orange">
                {shoppingList.totalEstimatedPrice.toFixed(2)}€
              </p>
            </div>
            <BrutalButton variant="orange" size="md" onClick={handleDownload}>
              <span className="flex items-center gap-2">
                <Download size={16} strokeWidth={3} />
                Télécharger
              </span>
            </BrutalButton>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
