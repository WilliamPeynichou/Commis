import { motion } from 'framer-motion';
import { Info, TrendingDown, Star } from 'lucide-react';

// ---------------------------------------------------------------------------
// Static store data based on French consumer studies
// Price indices: Que Choisir (2024), LSA Conso, 60 Millions de Consommateurs
// Quality scores: Shopper Observer (BVA), INSEE consumer surveys
// ---------------------------------------------------------------------------
interface StoreData {
  name: string;
  emoji: string;
  priceIndex: number;   // relative to a reference basket (Auchan = 1.00)
  qualityScore: number; // out of 10
  accentColor: string;
  bgColor: string;
  tagline: string;
}

const STORES: StoreData[] = [
  {
    name: 'Lidl',
    emoji: '🟡',
    priceIndex: 0.80,
    qualityScore: 7.0,
    accentColor: '#FFB800',
    bgColor: '#FFF9E6',
    tagline: 'Discounteur — MDD dominante',
  },
  {
    name: 'Leclerc',
    emoji: '🔵',
    priceIndex: 0.90,
    qualityScore: 8.0,
    accentColor: '#1B65A6',
    bgColor: '#EBF3FC',
    tagline: 'Leader prix hypers France',
  },
  {
    name: 'Auchan',
    emoji: '🔴',
    priceIndex: 1.00,
    qualityScore: 8.3,
    accentColor: '#E63027',
    bgColor: '#FEF0EF',
    tagline: 'Large gamme, rayon Bio solide',
  },
  {
    name: 'Carrefour',
    emoji: '🔵',
    priceIndex: 1.05,
    qualityScore: 7.8,
    accentColor: '#004A96',
    bgColor: '#EBF0F9',
    tagline: 'N°1 mondial, gamme étendue',
  },
];

interface StoreComparisonProps {
  totalEstimatedPrice: number;
}

function StarRating({ score }: { score: number }) {
  const full = Math.floor(score / 2);
  const half = score / 2 - full >= 0.25;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={12}
          strokeWidth={2}
          className={
            i < full
              ? 'fill-dark-orange text-dark-orange'
              : i === full && half
              ? 'fill-dark-orange/40 text-dark-orange'
              : 'text-deep-black/15'
          }
        />
      ))}
      <span className="text-xs font-bold text-deep-black/50 ml-1">{score}/10</span>
    </div>
  );
}

export function StoreComparison({ totalEstimatedPrice }: StoreComparisonProps) {
  const storesWithPrices = STORES.map((s) => ({
    ...s,
    estimatedPrice: Math.round(totalEstimatedPrice * s.priceIndex * 100) / 100,
    valueScore: Math.round((s.qualityScore / s.priceIndex) * 10) / 10,
  })).sort((a, b) => a.estimatedPrice - b.estimatedPrice);

  const maxPrice = Math.max(...storesWithPrices.map((s) => s.estimatedPrice));
  const minPrice = Math.min(...storesWithPrices.map((s) => s.estimatedPrice));
  const bestValue = [...storesWithPrices].sort((a, b) => b.valueScore - a.valueScore)[0];

  const medals = ['🥇', '🥈', '🥉', '4️⃣'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.1 }}
      className="section-brutal space-y-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <motion.div
            whileHover={{ rotate: -10 }}
            className="bg-pale-yellow p-3 rounded-2xl border-3 border-deep-black"
            style={{ boxShadow: '0 4px 0 0 rgba(26,26,26,0.6)' }}
          >
            <TrendingDown size={24} strokeWidth={2.5} />
          </motion.div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Comparatif enseignes
            </h2>
            <p className="text-sm text-deep-black/40 mt-0.5">
              Estimation pour votre liste — secteur Bordeaux
            </p>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="flex items-start gap-2 bg-sky/20 border border-sky/50 rounded-xl px-3 py-2 max-w-xs">
          <Info size={14} className="text-deep-black/50 mt-0.5 shrink-0" />
          <p className="text-[11px] text-deep-black/50 leading-snug">
            Estimations basées sur les indices de prix Que&nbsp;Choisir&nbsp;2024. Non contractuels.
          </p>
        </div>
      </div>

      {/* Best value banner */}
      <div className="flex items-center gap-3 px-4 py-3 bg-mint/30 rounded-2xl border-2 border-mint">
        <span className="text-2xl">🏆</span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-deep-black/50">
            Meilleur rapport qualité / prix
          </p>
          <p className="font-bold text-deep-black">
            {bestValue.name}
            <span className="ml-2 text-sm font-normal text-deep-black/50">
              — score valeur {bestValue.valueScore}
            </span>
          </p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-xs text-deep-black/40">Économie vs Carrefour</p>
          <p className="font-bold text-dark-orange">
            -{(storesWithPrices[storesWithPrices.length - 1].estimatedPrice - minPrice).toFixed(2)}€
          </p>
        </div>
      </div>

      {/* Store cards ranked by price */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-deep-black/40">
          Classement par prix estimé
        </h3>
        {storesWithPrices.map((store, i) => {
          const barWidth = (store.estimatedPrice / maxPrice) * 100;
          const isCheapest = i === 0;
          return (
            <motion.div
              key={store.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07 }}
              className={`relative rounded-2xl border-2 overflow-hidden ${
                isCheapest
                  ? 'border-mint shadow-[0_0_0_1px_rgba(168,230,207,0.5)]'
                  : 'border-deep-black/10'
              }`}
              style={{ backgroundColor: store.bgColor }}
            >
              <div className="flex items-center gap-4 px-4 py-3">
                {/* Rank */}
                <span className="text-xl w-7 text-center shrink-0">{medals[i]}</span>

                {/* Store name */}
                <div className="min-w-[90px]">
                  <p className="font-bold text-deep-black">{store.name}</p>
                  <p className="text-[10px] text-deep-black/40 leading-tight">{store.tagline}</p>
                </div>

                {/* Price bar */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2.5 bg-deep-black/10 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: store.accentColor }}
                        initial={{ width: 0 }}
                        animate={{ width: `${barWidth}%` }}
                        transition={{ duration: 0.6, delay: 0.2 + i * 0.07, ease: 'easeOut' }}
                      />
                    </div>
                    <span className="font-bold text-sm shrink-0 text-deep-black">
                      {store.estimatedPrice.toFixed(2)}€
                    </span>
                  </div>
                </div>

                {/* Quality */}
                <div className="shrink-0 text-right hidden sm:block">
                  <StarRating score={store.qualityScore} />
                </div>
              </div>

              {/* Cheapest badge */}
              {isCheapest && (
                <div
                  className="absolute top-0 right-0 text-[10px] font-bold px-2 py-0.5 rounded-bl-xl"
                  style={{ backgroundColor: store.accentColor, color: '#fff' }}
                >
                  Le moins cher
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Two-axis chart: Price vs Quality */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-deep-black/40">
          Prix vs Qualité
        </h3>
        <div className="bg-white rounded-2xl border-2 border-deep-black/10 p-4 space-y-4">
          {/* Quality bars */}
          <div>
            <p className="text-xs font-semibold text-deep-black/40 mb-2">
              Qualité produits (10)
            </p>
            {STORES.map((store, i) => (
              <div key={store.name} className="flex items-center gap-3 mb-1.5">
                <span className="text-xs font-medium text-deep-black/60 w-20 shrink-0">
                  {store.name}
                </span>
                <div className="flex-1 h-2 bg-deep-black/8 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-mauve"
                    initial={{ width: 0 }}
                    animate={{ width: `${(store.qualityScore / 10) * 100}%` }}
                    transition={{ duration: 0.6, delay: 0.3 + i * 0.07, ease: 'easeOut' }}
                  />
                </div>
                <span className="text-xs font-bold text-deep-black/50 w-8 text-right shrink-0">
                  {store.qualityScore}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-deep-black/8" />

          {/* Relative price bars (inverted: lower price = longer "savings" bar) */}
          <div>
            <p className="text-xs font-semibold text-deep-black/40 mb-2">
              Niveau de prix (bas = meilleur)
            </p>
            {STORES.sort((a, b) => a.priceIndex - b.priceIndex).map((store, i) => (
              <div key={store.name} className="flex items-center gap-3 mb-1.5">
                <span className="text-xs font-medium text-deep-black/60 w-20 shrink-0">
                  {store.name}
                </span>
                <div className="flex-1 h-2 bg-deep-black/8 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-dark-orange"
                    initial={{ width: 0 }}
                    animate={{ width: `${store.priceIndex * 100}%` }}
                    transition={{ duration: 0.6, delay: 0.4 + i * 0.07, ease: 'easeOut' }}
                  />
                </div>
                <span className="text-xs font-bold text-deep-black/50 w-12 text-right shrink-0">
                  {store.priceIndex < 1
                    ? `-${Math.round((1 - store.priceIndex) * 100)}%`
                    : `+${Math.round((store.priceIndex - 1) * 100)}%`}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footnote */}
      <p className="text-[11px] text-deep-black/30 text-center">
        Indices Que Choisir 2024 · Scores qualité BVA Shopper Observer · Bordeaux Métropole
      </p>
    </motion.div>
  );
}
