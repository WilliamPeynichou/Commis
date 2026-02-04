import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface BrutalSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  color: 'mauve' | 'orange' | 'yellow';
  budgetLabel: string;
}

const thumbColors = {
  mauve: '#B19CD9',
  orange: '#D96846',
  yellow: '#FFF4B5',
};

const bgColors = {
  mauve: 'bg-mauve/10',
  orange: 'bg-dark-orange/8',
  yellow: 'bg-pale-yellow/60',
};

const badgeColors = {
  mauve: 'bg-mauve',
  orange: 'bg-dark-orange text-white',
  yellow: 'bg-pale-yellow border-deep-black/20',
};

const accentBorder = {
  mauve: 'border-mauve/30',
  orange: 'border-dark-orange/20',
  yellow: 'border-pale-yellow',
};

export function BrutalSlider({
  label,
  value,
  min,
  max,
  onChange,
  color,
  budgetLabel,
}: BrutalSliderProps) {
  const id = `slider-${label.toLowerCase().replace(/\s/g, '-')}`;

  return (
    <div className={cn('p-5 rounded-2xl border-2', bgColors[color], accentBorder[color])}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <label htmlFor={id} className="font-bold text-sm tracking-wide block">
            {label}
          </label>
          <span className="text-xs text-deep-black/40 font-medium">{budgetLabel}</span>
        </div>
        <AnimatePresence mode="wait">
          <motion.span
            key={value}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            className={cn(
              'inline-flex items-center justify-center w-11 h-11 rounded-2xl border-2 border-deep-black font-bold text-lg',
              badgeColors[color]
            )}
            style={{ boxShadow: '0 3px 0 0 rgba(26,26,26,0.4)' }}
          >
            {value}
          </motion.span>
        </AnimatePresence>
      </div>

      <input
        id={id}
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
        style={{
          // @ts-ignore
          '--thumb-color': thumbColors[color],
        }}
      />
      <style>{`
        #${id}::-webkit-slider-thumb {
          background: ${thumbColors[color]};
        }
        #${id}::-moz-range-thumb {
          background: ${thumbColors[color]};
        }
      `}</style>
    </div>
  );
}
