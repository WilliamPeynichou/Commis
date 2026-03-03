import { useEffect, useState, useCallback } from 'react';
import { Search, Shield, User, ChefHat, Chrome } from 'lucide-react';
import { toast } from 'sonner';
import { fetchAdminUsers, patchUserRole, type AdminUser } from '../../lib/adminApi';

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function UsersPanel() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const debouncedSearch = useDebounce(search, 300);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAdminUsers({ page, search: debouncedSearch, role: roleFilter });
      setUsers(data.users);
      setTotal(data.total);
      setPages(data.pages);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, roleFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [debouncedSearch, roleFilter]);

  async function handleRoleChange(user: AdminUser) {
    const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
    const label = newRole === 'ADMIN' ? 'promouvoir en Admin' : 'rétrograder en User';
    if (!window.confirm(`Êtes-vous sûr de vouloir ${label} ${user.username} ?`)) return;
    try {
      await patchUserRole(user.id, newRole);
      toast.success(`Rôle de ${user.username} changé en ${newRole}`);
      load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erreur');
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-deep-black/30" strokeWidth={2.5} />
          <input
            type="text"
            placeholder="Rechercher par username ou email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-brutal w-full pl-9 text-sm"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="input-brutal text-sm min-w-[140px]"
        >
          <option value="">Tous les rôles</option>
          <option value="USER">User</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>

      {/* Count */}
      <p className="text-xs font-bold text-deep-black/40 uppercase tracking-widest">
        {total.toLocaleString('fr-FR')} utilisateur{total > 1 ? 's' : ''}
      </p>

      {/* Table */}
      <div className="card-brutal bg-off-white overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-4 border-mauve border-t-transparent rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <p className="text-center text-deep-black/40 text-sm py-12">Aucun utilisateur trouvé</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-3 border-deep-black">
                  <th className="text-left px-4 py-3 font-black text-deep-black text-xs uppercase tracking-wider">Utilisateur</th>
                  <th className="text-left px-4 py-3 font-black text-deep-black text-xs uppercase tracking-wider hidden md:table-cell">Email</th>
                  <th className="text-center px-4 py-3 font-black text-deep-black text-xs uppercase tracking-wider">Rôle</th>
                  <th className="text-center px-4 py-3 font-black text-deep-black text-xs uppercase tracking-wider hidden sm:table-cell">Recettes</th>
                  <th className="text-center px-4 py-3 font-black text-deep-black text-xs uppercase tracking-wider hidden lg:table-cell">Inscrit</th>
                  <th className="text-center px-4 py-3 font-black text-deep-black text-xs uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={u.id} className={`border-b border-deep-black/10 ${i % 2 === 0 ? 'bg-off-white' : 'bg-pale-yellow/20'}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        {u.avatarUrl ? (
                          <img src={u.avatarUrl} alt="" className="w-7 h-7 rounded-full border-2 border-deep-black" />
                        ) : (
                          <div className="w-7 h-7 rounded-full border-2 border-deep-black bg-mauve/30 flex items-center justify-center">
                            <span className="text-xs font-black text-deep-black">{u.username[0].toUpperCase()}</span>
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-deep-black">{u.username}</p>
                          {u.hasGoogleAccount && <div className="flex items-center gap-1 text-sky"><Chrome size={10} /><span className="text-xs">Google</span></div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-deep-black/60 hidden md:table-cell">{u.email}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border-2 border-deep-black ${
                        u.role === 'ADMIN' ? 'bg-dark-orange text-white' : 'bg-mauve/30 text-deep-black'
                      }`}>
                        {u.role === 'ADMIN' ? <Shield size={10} /> : <User size={10} />}
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      <span className="flex items-center justify-center gap-1 text-deep-black/60">
                        <ChefHat size={12} />
                        {u._count.recipeHistory}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-deep-black/40 text-xs hidden lg:table-cell">
                      {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleRoleChange(u)}
                        className={`text-xs font-bold px-2.5 py-1 rounded-lg border-2 border-deep-black transition-colors ${
                          u.role === 'ADMIN'
                            ? 'bg-blush/40 hover:bg-blush/70 text-deep-black'
                            : 'bg-mint/40 hover:bg-mint/70 text-deep-black'
                        }`}
                      >
                        {u.role === 'ADMIN' ? '↓ User' : '↑ Admin'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-brutal text-sm px-4 py-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ← Précédent
          </button>
          <span className="text-sm font-bold text-deep-black/60">
            Page {page} / {pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page === pages}
            className="btn-brutal text-sm px-4 py-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Suivant →
          </button>
        </div>
      )}
    </div>
  );
}
