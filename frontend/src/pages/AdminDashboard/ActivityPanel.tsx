import { useEffect, useState, useCallback } from 'react';
import { ChefHat, Shield, User } from 'lucide-react';
import { toast } from 'sonner';
import { fetchAdminActivity, fetchAdminLogs, type ActivityLog, type AdminLog } from '../../lib/adminApi';

type Tab = 'activity' | 'logs';

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `il y a ${d}j`;
  if (h > 0) return `il y a ${h}h`;
  if (m > 0) return `il y a ${m}min`;
  return 'à l\'instant';
}

export function ActivityPanel() {
  const [tab, setTab] = useState<Tab>('activity');
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [adminLogs, setAdminLogs] = useState<AdminLog[]>([]);
  const [activityPage, setActivityPage] = useState(1);
  const [activityPages, setActivityPages] = useState(1);
  const [adminPage, setAdminPage] = useState(1);
  const [adminPages, setAdminPages] = useState(1);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(true);

  const loadActivity = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAdminActivity({
        page: activityPage,
        from: from ? new Date(from).toISOString() : undefined,
        to: to ? new Date(to + 'T23:59:59').toISOString() : undefined,
      });
      setActivityLogs(data.logs);
      setActivityPages(data.pages);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  }, [activityPage, from, to]);

  const loadAdminLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAdminLogs({ page: adminPage });
      setAdminLogs(data.logs);
      setAdminPages(data.pages);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  }, [adminPage]);

  useEffect(() => {
    if (tab === 'activity') loadActivity();
    else loadAdminLogs();
  }, [tab, loadActivity, loadAdminLogs]);

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-2">
        {(['activity', 'logs'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-bold border-3 border-deep-black rounded-xl transition-colors ${
              tab === t ? 'bg-deep-black text-off-white' : 'bg-off-white text-deep-black hover:bg-pale-yellow'
            }`}
          >
            {t === 'activity' ? 'Activité globale' : 'Actions admin'}
          </button>
        ))}
      </div>

      {/* Date filters (activity only) */}
      {tab === 'activity' && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-deep-black/50 uppercase tracking-wider w-10">Du</label>
            <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setActivityPage(1); }} className="input-brutal text-sm" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-deep-black/50 uppercase tracking-wider w-10">Au</label>
            <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setActivityPage(1); }} className="input-brutal text-sm" />
          </div>
          {(from || to) && (
            <button onClick={() => { setFrom(''); setTo(''); setActivityPage(1); }} className="text-xs font-bold text-dark-orange underline">
              Réinitialiser
            </button>
          )}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-4 border-mauve border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tab === 'activity' ? (
        <>
          <div className="space-y-2">
            {activityLogs.length === 0 ? (
              <p className="text-center text-deep-black/40 text-sm py-12 card-brutal bg-off-white">Aucune activité</p>
            ) : activityLogs.map((log) => (
              <div key={log.id} className="card-brutal bg-off-white p-3 flex items-start gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 border-2 border-deep-black ${
                  log.type === 'RECIPE_GENERATED' ? 'bg-mauve/30' : 'bg-dark-orange/20'
                }`}>
                  {log.type === 'RECIPE_GENERATED' ? <ChefHat size={14} /> : <Shield size={14} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border-2 border-deep-black ${
                      log.type === 'RECIPE_GENERATED' ? 'bg-mauve/30 text-deep-black' : 'bg-dark-orange text-white'
                    }`}>
                      {log.type === 'RECIPE_GENERATED' ? 'Recette' : 'Admin'}
                    </span>
                    {log.username && (
                      <span className="flex items-center gap-1 text-xs font-medium text-deep-black/60">
                        <User size={10} />{log.username}
                      </span>
                    )}
                    {!log.username && log.sessionId && (
                      <span className="text-xs text-deep-black/40">session anon</span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-deep-black mt-1 truncate">{log.description}</p>
                </div>
                <span className="text-xs text-deep-black/30 flex-shrink-0 mt-1">{timeAgo(log.createdAt)}</span>
              </div>
            ))}
          </div>
          {activityPages > 1 && (
            <div className="flex items-center justify-between">
              <button onClick={() => setActivityPage((p) => Math.max(1, p - 1))} disabled={activityPage === 1} className="btn-brutal text-sm px-4 py-2 disabled:opacity-40">← Précédent</button>
              <span className="text-sm font-bold text-deep-black/60">Page {activityPage} / {activityPages}</span>
              <button onClick={() => setActivityPage((p) => Math.min(activityPages, p + 1))} disabled={activityPage === activityPages} className="btn-brutal text-sm px-4 py-2 disabled:opacity-40">Suivant →</button>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="space-y-2">
            {adminLogs.length === 0 ? (
              <p className="text-center text-deep-black/40 text-sm py-12 card-brutal bg-off-white">Aucune action admin enregistrée</p>
            ) : adminLogs.map((log) => (
              <div key={log.id} className="card-brutal bg-off-white p-3 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 border-2 border-deep-black bg-dark-orange/20">
                  <Shield size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full border-2 border-deep-black bg-dark-orange text-white">{log.action}</span>
                    <span className="text-xs font-medium text-deep-black/60">par {log.adminUsername}</span>
                  </div>
                  {log.meta && (
                    <p className="text-xs text-deep-black/50 mt-1 font-mono">{JSON.stringify(log.meta)}</p>
                  )}
                </div>
                <span className="text-xs text-deep-black/30 flex-shrink-0 mt-1">{timeAgo(log.createdAt)}</span>
              </div>
            ))}
          </div>
          {adminPages > 1 && (
            <div className="flex items-center justify-between">
              <button onClick={() => setAdminPage((p) => Math.max(1, p - 1))} disabled={adminPage === 1} className="btn-brutal text-sm px-4 py-2 disabled:opacity-40">← Précédent</button>
              <span className="text-sm font-bold text-deep-black/60">Page {adminPage} / {adminPages}</span>
              <button onClick={() => setAdminPage((p) => Math.min(adminPages, p + 1))} disabled={adminPage === adminPages} className="btn-brutal text-sm px-4 py-2 disabled:opacity-40">Suivant →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
