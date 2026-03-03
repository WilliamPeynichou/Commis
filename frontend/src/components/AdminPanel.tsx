import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, ShieldOff, Plus, AlertCircle, Users, Ban } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  adminGetUsers,
  adminDeleteUser,
  adminGetBlacklist,
  adminAddBlacklist,
  adminRemoveBlacklist,
  type AdminUser,
  type BlacklistEntry,
} from '../lib/adminApi';

interface AdminPanelProps {
  onClose: () => void;
}

export function AdminPanel({ onClose }: AdminPanelProps) {
  const { user } = useAuth();
  const [tab, setTab] = useState<'users' | 'blacklist'>('users');

  // Users state
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState('');

  // Blacklist state
  const [entries, setEntries] = useState<BlacklistEntry[]>([]);
  const [blacklistLoading, setBlacklistLoading] = useState(true);
  const [blacklistError, setBlacklistError] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newReason, setNewReason] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    setUsersError('');
    try {
      setUsers(await adminGetUsers());
    } catch (e) {
      setUsersError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setUsersLoading(false);
    }
  }, []);

  const loadBlacklist = useCallback(async () => {
    setBlacklistLoading(true);
    setBlacklistError('');
    try {
      setEntries(await adminGetBlacklist());
    } catch (e) {
      setBlacklistError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setBlacklistLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);
  useEffect(() => { loadBlacklist(); }, [loadBlacklist]);

  async function handleDeleteUser(id: string, username: string) {
    if (!confirm(`Supprimer le compte de "${username}" ? Cette action est irréversible.`)) return;
    try {
      await adminDeleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (e) {
      setUsersError(e instanceof Error ? e.message : 'Erreur lors de la suppression');
    }
  }

  async function handleAddBlacklist(e: React.FormEvent) {
    e.preventDefault();
    if (!newEmail.trim()) return;
    setAddLoading(true);
    setAddError('');
    try {
      const entry = await adminAddBlacklist(newEmail.trim(), newReason.trim() || undefined);
      setEntries((prev) => [entry, ...prev]);
      setNewEmail('');
      setNewReason('');
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setAddLoading(false);
    }
  }

  async function handleRemoveBlacklist(id: string, email: string) {
    if (!confirm(`Retirer "${email}" de la blacklist ?`)) return;
    try {
      await adminRemoveBlacklist(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch (e) {
      setBlacklistError(e instanceof Error ? e.message : 'Erreur');
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
        className="w-full max-w-2xl bg-off-white rounded-3xl border-3 border-deep-black overflow-hidden flex flex-col max-h-[85vh]"
        style={{ boxShadow: '8px 8px 0px 0px rgba(26,26,26,1)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b-2 border-deep-black/10 shrink-0">
          <div>
            <h2 className="text-xl font-bold">Panneau Admin</h2>
            <p className="text-xs text-deep-black/40 mt-0.5">Gestion des comptes et de la blacklist</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-deep-black/5 transition-colors">
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4 shrink-0">
          <div className="flex gap-1 bg-deep-black/5 p-1 rounded-2xl">
            <button
              onClick={() => setTab('users')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-xl transition-all ${
                tab === 'users'
                  ? 'bg-white shadow-sm text-deep-black border border-deep-black/10'
                  : 'text-deep-black/40 hover:text-deep-black/60'
              }`}
            >
              <Users size={14} />
              Utilisateurs ({users.length})
            </button>
            <button
              onClick={() => setTab('blacklist')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-xl transition-all ${
                tab === 'blacklist'
                  ? 'bg-white shadow-sm text-deep-black border border-deep-black/10'
                  : 'text-deep-black/40 hover:text-deep-black/60'
              }`}
            >
              <Ban size={14} />
              Blacklist ({entries.length})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {tab === 'users' && (
            <>
              {usersError && <ErrorBanner message={usersError} />}
              {usersLoading ? (
                <LoadingRows />
              ) : users.length === 0 ? (
                <p className="text-sm text-deep-black/40 text-center py-8">Aucun utilisateur</p>
              ) : (
                users.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-3 bg-white rounded-2xl border border-deep-black/8"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-mauve border-2 border-deep-black/20 flex items-center justify-center text-xs font-bold text-deep-black shrink-0">
                        {u.username.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-bold text-deep-black truncate">{u.username}</p>
                          {u.role === 'ADMIN' && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-dark-orange/10 text-dark-orange rounded-md uppercase tracking-wide shrink-0">
                              Admin
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-deep-black/40 truncate">{u.email}</p>
                        <div className="flex gap-2 mt-0.5">
                          {u.hasGoogle && <span className="text-[10px] text-deep-black/30 font-medium">Google</span>}
                          {u.hasPassword && <span className="text-[10px] text-deep-black/30 font-medium">Mot de passe</span>}
                        </div>
                      </div>
                    </div>
                    {u.id !== user?.id && u.role !== 'ADMIN' && (
                      <button
                        onClick={() => handleDeleteUser(u.id, u.username)}
                        className="p-2 text-deep-black/30 hover:text-dark-orange hover:bg-dark-orange/5 rounded-xl transition-colors shrink-0 ml-2"
                        title="Supprimer ce compte"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </>
          )}

          {tab === 'blacklist' && (
            <>
              {/* Add form */}
              <form onSubmit={handleAddBlacklist} className="p-4 bg-white rounded-2xl border border-deep-black/8 space-y-2">
                <p className="text-xs font-semibold text-deep-black/50 uppercase tracking-wide">Bannir une adresse email</p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="email@exemple.com"
                    required
                    className="flex-1 px-3 py-2 bg-off-white border-2 border-deep-black/15 rounded-xl text-sm font-medium placeholder:text-deep-black/25 focus:outline-none focus:border-mauve transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={addLoading}
                    className="flex items-center gap-1.5 px-4 py-2 bg-dark-orange/10 border-2 border-dark-orange/30 text-dark-orange text-sm font-bold rounded-xl hover:bg-dark-orange/20 transition-colors disabled:opacity-50"
                  >
                    <Plus size={14} />
                    Bannir
                  </button>
                </div>
                <input
                  type="text"
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  placeholder="Raison (optionnel)"
                  maxLength={500}
                  className="w-full px-3 py-2 bg-off-white border-2 border-deep-black/15 rounded-xl text-sm font-medium placeholder:text-deep-black/25 focus:outline-none focus:border-mauve transition-colors"
                />
                {addError && <ErrorBanner message={addError} />}
              </form>

              {blacklistError && <ErrorBanner message={blacklistError} />}
              {blacklistLoading ? (
                <LoadingRows />
              ) : entries.length === 0 ? (
                <p className="text-sm text-deep-black/40 text-center py-8">Aucune adresse bannie</p>
              ) : (
                entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-3 bg-white rounded-2xl border border-deep-black/8"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <ShieldOff size={13} className="text-dark-orange shrink-0" />
                        <p className="text-sm font-bold text-deep-black truncate">{entry.email}</p>
                      </div>
                      {entry.reason && (
                        <p className="text-xs text-deep-black/40 mt-0.5 ml-5 truncate">{entry.reason}</p>
                      )}
                      <p className="text-xs text-deep-black/25 mt-0.5 ml-5">
                        {new Date(entry.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveBlacklist(entry.id, entry.email)}
                      className="p-2 text-deep-black/30 hover:text-mauve hover:bg-mauve/10 rounded-xl transition-colors shrink-0 ml-2"
                      title="Retirer de la blacklist"
                    >
                      <X size={15} />
                    </button>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2.5 bg-blush/30 border border-blush rounded-xl">
      <AlertCircle size={14} className="text-dark-orange shrink-0" />
      <p className="text-xs font-medium text-dark-orange">{message}</p>
    </div>
  );
}

function LoadingRows() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-14 bg-deep-black/5 rounded-2xl animate-pulse" />
      ))}
    </div>
  );
}
