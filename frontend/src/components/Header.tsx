import { motion } from 'framer-motion';
import { ChefHat, Sparkles } from 'lucide-react';

export function Header() {
  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 120, damping: 20 }}
      className="relative bg-off-white/80 backdrop-blur-lg border-b-3 border-deep-black/10 sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Logo icon with 3D effect */}
            <motion.div
              whileHover={{ rotate: -10, scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="relative"
            >
              <div className="bg-mauve p-3.5 rounded-2xl border-3 border-deep-black relative"
                   style={{ boxShadow: '0 6px 0 0 rgba(26, 26, 26, 0.8)' }}>
                <ChefHat size={28} strokeWidth={2.5} className="text-deep-black" />
              </div>
              {/* Floating sparkle */}
              <motion.div
                animate={{ y: [-2, 2, -2], rotate: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-2 -right-2"
              >
                <Sparkles size={16} strokeWidth={3} className="text-dark-orange" />
              </motion.div>
            </motion.div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-deep-black leading-none tracking-tight">
                Recipe <span className="text-mauve">Planner</span>
              </h1>
              <p className="text-xs sm:text-sm font-medium text-deep-black/40 mt-0.5">
                Planification intelligente par IA
              </p>
            </div>
          </div>

          {/* Decorative pills */}
          <div className="hidden sm:flex items-center gap-2">
            <span className="badge-float bg-pale-yellow text-deep-black">
              Claude AI
            </span>
            <span className="badge-float bg-mauve text-deep-black">
              Smart Recipes
            </span>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
