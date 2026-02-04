import { motion } from 'framer-motion';
import { ChefHat } from 'lucide-react';

export function Spinner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-24 gap-8"
    >
      {/* Animated cooking icon */}
      <div className="relative">
        {/* Pulsing ring */}
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 rounded-full bg-mauve/20"
          style={{ margin: '-16px' }}
        />

        {/* Spinning border */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-20 h-20 rounded-full border-4 border-deep-black/10 border-t-mauve border-r-dark-orange"
        />

        {/* Center icon */}
        <motion.div
          animate={{ y: [-2, 2, -2], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <ChefHat size={28} strokeWidth={2.5} className="text-mauve" />
        </motion.div>
      </div>

      <div className="text-center space-y-2">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="font-bold text-lg text-deep-black"
        >
          Génération en cours...
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-sm text-deep-black/40 font-medium"
        >
          Notre chef IA compose vos menus
        </motion.p>
      </div>

      {/* Animated dots */}
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ y: [-3, 3, -3] }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.15,
            }}
            className="w-3 h-3 rounded-full border-2 border-deep-black"
            style={{
              backgroundColor: ['#B19CD9', '#D96846', '#FFF4B5'][i],
              boxShadow: '0 2px 0 0 rgba(26,26,26,0.4)',
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}
