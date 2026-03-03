import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AuthModalProps {
  onClose: () => void;
  initialTab?: 'login' | 'register';
}

export function AuthModal({ onClose, initialTab = 'login' }: AuthModalProps) {
  const { login, register, loginWithGoogle } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>(initialTab);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Form state
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const clearError = () => setError('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      if (tab === 'login') {
        await login(email, password);
      } else {
        await register(username, email, password);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
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
        className="w-full max-w-md bg-off-white rounded-3xl border-3 border-deep-black overflow-hidden"
        style={{ boxShadow: '8px 8px 0px 0px rgba(26,26,26,1)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b-2 border-deep-black/10">
          <div>
            <h2 className="text-xl font-bold">
              {tab === 'login' ? 'Connexion' : 'Créer un compte'}
            </h2>
            <p className="text-xs text-deep-black/40 mt-0.5">
              {tab === 'login'
                ? 'Tes recettes t\'attendent'
                : 'Rejoins la cuisine de Jade'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-deep-black/5 transition-colors"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Tabs */}
          <div className="flex gap-1 bg-deep-black/5 p-1 rounded-2xl">
            {(['login', 'register'] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); clearError(); }}
                className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all ${
                  tab === t
                    ? 'bg-white shadow-sm text-deep-black border border-deep-black/10'
                    : 'text-deep-black/40 hover:text-deep-black/60'
                }`}
              >
                {t === 'login' ? 'Connexion' : 'Inscription'}
              </button>
            ))}
          </div>

          {/* Google OAuth */}
          <button
            type="button"
            onClick={loginWithGoogle}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 border-2 border-deep-black/15 rounded-2xl font-semibold text-sm hover:border-deep-black/30 hover:bg-deep-black/3 transition-all"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Continuer avec Google
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-deep-black/10" />
            <span className="text-xs text-deep-black/30 font-medium">ou</span>
            <div className="flex-1 h-px bg-deep-black/10" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <AnimatePresence mode="wait">
              {tab === 'register' && (
                <motion.div
                  key="username"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <label className="block text-xs font-semibold text-deep-black/50 mb-1.5 uppercase tracking-wide">
                    Pseudo
                  </label>
                  <div className="relative">
                    <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-deep-black/30" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="mon_pseudo"
                      required={tab === 'register'}
                      autoComplete="username"
                      className="w-full pl-10 pr-4 py-3 bg-white border-2 border-deep-black/15 rounded-2xl text-sm font-medium placeholder:text-deep-black/25 focus:outline-none focus:border-mauve transition-colors"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="block text-xs font-semibold text-deep-black/50 mb-1.5 uppercase tracking-wide">
                Email
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-deep-black/30" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jade@example.com"
                  required
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-3 bg-white border-2 border-deep-black/15 rounded-2xl text-sm font-medium placeholder:text-deep-black/25 focus:outline-none focus:border-mauve transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-deep-black/50 mb-1.5 uppercase tracking-wide">
                Mot de passe
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-deep-black/30" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={tab === 'register' ? 'Min. 8 caractères, 1 lettre, 1 chiffre' : '••••••••'}
                  required
                  autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                  className="w-full pl-10 pr-10 py-3 bg-white border-2 border-deep-black/15 rounded-2xl text-sm font-medium placeholder:text-deep-black/25 focus:outline-none focus:border-mauve transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-deep-black/30 hover:text-deep-black/60 transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 px-3 py-2.5 bg-blush/30 border border-blush rounded-xl"
                >
                  <AlertCircle size={14} className="text-dark-orange shrink-0" />
                  <p className="text-xs font-medium text-dark-orange">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-mauve font-bold text-deep-black rounded-2xl border-2 border-deep-black transition-all hover:bg-mauve-dark disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ boxShadow: isLoading ? 'none' : '0 4px 0 0 rgba(26,26,26,0.8)' }}
            >
              {isLoading
                ? 'Chargement...'
                : tab === 'login'
                  ? 'Se connecter'
                  : 'Créer mon compte'}
            </button>
          </form>

          <p className="text-center text-xs text-deep-black/30">
            {tab === 'login' ? "Pas encore de compte ? " : "Déjà un compte ? "}
            <button
              onClick={() => { setTab(tab === 'login' ? 'register' : 'login'); clearError(); }}
              className="font-semibold text-mauve-dark hover:underline"
            >
              {tab === 'login' ? 'Inscription' : 'Connexion'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
