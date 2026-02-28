import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, ChevronDown, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

export function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!user) return null;

  const initials = user.username.slice(0, 2).toUpperCase();

  async function handleLogout() {
    setOpen(false);
    await logout();
    toast.success('Déconnecté');
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-2 rounded-2xl border-2 border-deep-black/10 hover:border-deep-black/20 bg-white hover:bg-deep-black/3 transition-all"
      >
        {/* Avatar */}
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.username}
            className="w-7 h-7 rounded-full object-cover border border-deep-black/10"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-mauve border-2 border-deep-black/20 flex items-center justify-center text-xs font-bold text-deep-black">
            {initials}
          </div>
        )}
        <span className="text-sm font-semibold text-deep-black hidden sm:block max-w-24 truncate">
          {user.username}
        </span>
        {user.role === 'ADMIN' && (
          <Shield size={12} className="text-dark-orange hidden sm:block" />
        )}
        <ChevronDown
          size={14}
          strokeWidth={2.5}
          className={`text-deep-black/40 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-52 bg-white border-2 border-deep-black/10 rounded-2xl overflow-hidden z-50"
            style={{ boxShadow: '4px 4px 0px 0px rgba(26,26,26,0.15)' }}
          >
            {/* User info */}
            <div className="px-4 py-3 border-b border-deep-black/8">
              <div className="flex items-center gap-2">
                {user.role === 'ADMIN' && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-dark-orange/10 text-dark-orange rounded-md uppercase tracking-wide">
                    Admin
                  </span>
                )}
              </div>
              <p className="font-bold text-sm text-deep-black truncate mt-0.5">{user.username}</p>
              <p className="text-xs text-deep-black/40 truncate">{user.email}</p>
            </div>

            {/* Actions */}
            <div className="p-1.5">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-deep-black/70 hover:text-dark-orange hover:bg-dark-orange/5 rounded-xl transition-colors"
              >
                <LogOut size={14} strokeWidth={2.5} />
                Se déconnecter
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
