import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, AlertCircle } from 'lucide-react';
import { RecipeCard } from './RecipeCard';
import { getFavorites, removeFavorite } from '../lib/favoritesApi';
import type { Recipe } from '@shared/index';

interface FavoritesPanelProps {
  onClose: () => void;
}

export function FavoritesPanel({ onClose }: FavoritesPanelProps) {
  const [favorites, setFavorites] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setFavorites(await getFavorites());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleRemove(recipe: Recipe) {
    try {
      await removeFavorite(recipe.id);
      setFavorites((prev) => prev.filter((r) => r.id !== recipe.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deep-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="w-full max-w-4xl bg-off-white rounded-3xl border-3 border-deep-black overflow-hidden flex flex-col max-h-[90vh]"
        style={{ boxShadow: '8px 8px 0px 0px rgba(26,26,26,1)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b-2 border-deep-black/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-blush p-2.5 rounded-2xl border-3 border-deep-black"
              style={{ boxShadow: '0 4px 0 0 rgba(26,26,26,0.6)' }}>
              <Heart size={20} strokeWidth={2.5} className="fill-dark-orange text-dark-orange" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Mes favoris</h2>
              <p className="text-xs text-deep-black/40 mt-0.5">
                {loading ? '…' : `${favorites.length} recette${favorites.length !== 1 ? 's' : ''} sauvegardée${favorites.length !== 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-deep-black/5 transition-colors">
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-blush/30 border border-blush rounded-xl mb-4">
              <AlertCircle size={14} className="text-dark-orange shrink-0" />
              <p className="text-xs font-medium text-dark-orange">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-deep-black/5 rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : favorites.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="text-6xl">🍽️</div>
              <p className="text-deep-black/40 font-medium text-center">
                Aucun favori pour l'instant.<br />
                Cliquez sur le cœur d'une recette pour la sauvegarder ici.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {favorites.map((recipe, index) => (
                  <motion.div
                    key={recipe.id}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                    <RecipeCard
                      recipe={recipe}
                      index={index}
                      isFavorited={true}
                      onToggleFavorite={handleRemove}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
