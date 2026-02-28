import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChefHat, Sparkles, LogIn } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AuthModal } from './AuthModal';
import { UserMenu } from './UserMenu';

export function Header() {
  const { user, isLoading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        className="relative bg-off-white/80 backdrop-blur-lg border-b-3 border-deep-black/10 sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                whileHover={{ rotate: -10, scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="relative"
              >
                <div className="bg-mauve p-3.5 rounded-2xl border-3 border-deep-black relative"
                     style={{ boxShadow: '0 6px 0 0 rgba(26, 26, 26, 0.8)' }}>
                  <ChefHat size={28} strokeWidth={2.5} className="text-deep-black" />
                </div>
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
                  Cuisine <span className="text-mauve">de Jade</span>
                </h1>
                <p className="text-xs sm:text-sm font-medium text-deep-black/40 mt-0.5">
                  Planification de recettes de cuisine pour jade car elle en peut plus en gros
                </p>
              </div>
            </div>

            {/* Auth area */}
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2">
                <span className="badge-float bg-pale-yellow text-deep-black">Fais par Claude</span>
                <span className="badge-float bg-mauve text-deep-black">Pour Jade</span>
              </div>

              {!isLoading && (
                <>
                  {user ? (
                    <UserMenu />
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setShowAuth(true)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-mauve text-deep-black font-bold text-sm rounded-2xl border-2 border-deep-black transition-all"
                      style={{ boxShadow: '0 4px 0 0 rgba(26,26,26,0.6)' }}
                    >
                      <LogIn size={15} strokeWidth={2.5} />
                      <span className="hidden sm:inline">Connexion</span>
                    </motion.button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      </AnimatePresence>
    </>
  );
}
