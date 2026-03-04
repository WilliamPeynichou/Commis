import { useState } from 'react';
import { ChefHat, Lock } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { AuthModal } from './AuthModal';

export function AuthGate() {
  const [showAuth, setShowAuth] = useState(false);
  const [initialTab, setInitialTab] = useState<'login' | 'register'>('login');

  function openLogin() {
    setInitialTab('login');
    setShowAuth(true);
  }

  function openRegister() {
    setInitialTab('register');
    setShowAuth(true);
  }

  return (
    <>
      <div className="flex items-center justify-center py-16 px-4">
        <div
          className="w-full max-w-md bg-off-white rounded-3xl border-3 border-deep-black p-8 text-center"
          style={{ boxShadow: '8px 8px 0px 0px rgba(26,26,26,1)' }}
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-3 bg-mauve/20 rounded-2xl border-2 border-deep-black/10">
              <ChefHat size={28} strokeWidth={2} className="text-deep-black" />
            </div>
            <div className="p-3 bg-blush/30 rounded-2xl border-2 border-deep-black/10">
              <Lock size={28} strokeWidth={2} className="text-deep-black" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-deep-black mb-2">
            Connecte-toi pour accéder à tes recettes
          </h2>
          <p className="text-sm text-deep-black/50 mb-8">
            Commis génère des menus personnalisés pour la semaine grâce à Claude AI — sans jamais te répéter la même recette.
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={openLogin}
              className="w-full py-3.5 bg-mauve font-bold text-deep-black rounded-2xl border-2 border-deep-black transition-all hover:bg-mauve-dark"
              style={{ boxShadow: '0 4px 0 0 rgba(26,26,26,0.8)' }}
            >
              Se connecter
            </button>
            <button
              onClick={openRegister}
              className="w-full py-3.5 bg-off-white font-bold text-deep-black rounded-2xl border-2 border-deep-black transition-all hover:bg-deep-black/5"
              style={{ boxShadow: '0 4px 0 0 rgba(26,26,26,0.8)' }}
            >
              Créer un compte
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showAuth && (
          <AuthModal
            onClose={() => setShowAuth(false)}
            initialTab={initialTab}
          />
        )}
      </AnimatePresence>
    </>
  );
}
