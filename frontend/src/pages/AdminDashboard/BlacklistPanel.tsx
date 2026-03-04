import { useState, useEffect, useCallback } from 'react';
import { ShieldOff, Plus, AlertCircle, X } from 'lucide-react';
import {
  adminGetBlacklist,
  adminAddBlacklist,
  adminRemoveBlacklist,
  type BlacklistEntry,
} from '../../lib/adminApi';

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2.5 bg-blush/30 border border-blush rounded-xl">
      <AlertCircle size={14} className="text-dark-orange shrink-0" />
      <p className="text-xs font-medium text-dark-orange">{message}</p>
    </div>
  );
}

export function BlacklistPanel() {
  const [entries, setEntries] = useState<BlacklistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newReason, setNewReason] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setEntries(await adminGetBlacklist());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleAdd(e: React.FormEvent) {
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

  async function handleRemove(id: string, email: string) {
    if (!window.confirm(`Retirer "${email}" de la blacklist ?`)) return;
    try {
      await adminRemoveBlacklist(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-xs font-bold text-deep-black/40 uppercase tracking-widest">
        {entries.length} adresse{entries.length > 1 ? 's' : ''} bannie{entries.length > 1 ? 's' : ''}
      </p>

      {/* Add form */}
      <form onSubmit={handleAdd} className="card-brutal bg-off-white p-4 space-y-2">
        <p className="text-xs font-semibold text-deep-black/50 uppercase tracking-wide">Bannir une adresse email</p>
        <div className="flex gap-2">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="email@exemple.com"
            required
            className="input-brutal flex-1 text-sm"
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
          className="input-brutal w-full text-sm"
        />
        {addError && <ErrorBanner message={addError} />}
      </form>

      {error && <ErrorBanner message={error} />}

      {/* List */}
      <div className="card-brutal bg-off-white overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-4 border-mauve border-t-transparent rounded-full animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <p className="text-center text-deep-black/40 text-sm py-12">Aucune adresse bannie</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-3 border-deep-black">
                  <th className="text-left px-4 py-3 font-black text-deep-black text-xs uppercase tracking-wider">Email</th>
                  <th className="text-left px-4 py-3 font-black text-deep-black text-xs uppercase tracking-wider hidden md:table-cell">Raison</th>
                  <th className="text-center px-4 py-3 font-black text-deep-black text-xs uppercase tracking-wider hidden sm:table-cell">Date</th>
                  <th className="text-center px-4 py-3 font-black text-deep-black text-xs uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, i) => (
                  <tr key={entry.id} className={`border-b border-deep-black/10 ${i % 2 === 0 ? 'bg-off-white' : 'bg-pale-yellow/20'}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <ShieldOff size={13} className="text-dark-orange shrink-0" />
                        <span className="font-bold text-deep-black">{entry.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-deep-black/60 hidden md:table-cell">
                      {entry.reason || <span className="text-deep-black/25 italic">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center text-deep-black/40 text-xs hidden sm:table-cell">
                      {new Date(entry.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleRemove(entry.id, entry.email)}
                        className="p-1.5 text-deep-black/40 hover:text-dark-orange hover:bg-dark-orange/10 rounded-lg border-2 border-deep-black/10 hover:border-dark-orange/30 transition-colors"
                        title="Retirer de la blacklist"
                      >
                        <X size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
