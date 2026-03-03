import { useEffect, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Users, ChefHat, Activity, TrendingUp, UserCheck, Clock } from 'lucide-react';
import { fetchAdminStats, type AdminStats } from '../../lib/adminApi';

const COLORS = {
  mauve: '#B19CD9',
  orange: '#D96846',
  yellow: '#FFF4B5',
  mint: '#A8E6CF',
  grid: 'rgba(26,26,26,0.06)',
};

interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  sub?: string;
  color: string;
}

function KpiCard({ icon, label, value, sub, color }: KpiCardProps) {
  return (
    <div className="card-brutal bg-off-white p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-widest text-deep-black/40">{label}</span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center`} style={{ background: color + '33' }}>
          <div style={{ color }}>{icon}</div>
        </div>
      </div>
      <div>
        <p className="text-3xl font-black text-deep-black">{typeof value === 'number' ? value.toLocaleString('fr-FR') : value}</p>
        {sub && <p className="text-xs font-medium text-deep-black/40 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

export function StatsPanel() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminStats()
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-mauve border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (error) return <div className="card-brutal bg-blush/20 p-4 text-deep-black font-medium">{error}</div>;
  if (!stats) return null;

  const pieData = [
    { name: 'Authentifiés', value: stats.authenticatedVsAnonymous.authenticated },
    { name: 'Anonymes', value: stats.authenticatedVsAnonymous.anonymous },
  ];

  return (
    <div className="space-y-8">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <KpiCard
          icon={<Users size={18} strokeWidth={2.5} />}
          label="Utilisateurs"
          value={stats.totalUsers}
          sub={`+${stats.newUsersLast7Days} cette semaine`}
          color={COLORS.mauve}
        />
        <KpiCard
          icon={<TrendingUp size={18} strokeWidth={2.5} />}
          label="Nouveaux (30j)"
          value={stats.newUsersLast30Days}
          sub={`${stats.usersByRole.ADMIN} admin(s)`}
          color={COLORS.orange}
        />
        <KpiCard
          icon={<ChefHat size={18} strokeWidth={2.5} />}
          label="Recettes générées"
          value={stats.totalRecipesGenerated}
          sub={`+${stats.recipesLast7Days} cette semaine`}
          color={COLORS.mint}
        />
        <KpiCard
          icon={<Activity size={18} strokeWidth={2.5} />}
          label="Générations (30j)"
          value={stats.recipesLast30Days}
          color={COLORS.mauve}
        />
        <KpiCard
          icon={<Clock size={18} strokeWidth={2.5} />}
          label="Sessions actives (7j)"
          value={stats.activeSessionsLast7Days}
          color={COLORS.orange}
        />
        <KpiCard
          icon={<UserCheck size={18} strokeWidth={2.5} />}
          label="Ratio auth/anon"
          value={stats.authenticatedVsAnonymous.authenticated + stats.authenticatedVsAnonymous.anonymous > 0
            ? `${Math.round(stats.authenticatedVsAnonymous.authenticated / (stats.authenticatedVsAnonymous.authenticated + stats.authenticatedVsAnonymous.anonymous) * 100)}%`
            : '0%'}
          sub="utilisateurs connectés"
          color={COLORS.mint}
        />
      </div>

      {/* Activity Chart */}
      <div className="card-brutal bg-off-white p-5">
        <h3 className="font-black text-deep-black mb-4">Activité quotidienne (30 derniers jours)</h3>
        {stats.dailyActivity.length === 0 ? (
          <p className="text-deep-black/40 text-sm text-center py-8">Aucune donnée disponible</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={stats.dailyActivity} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.mauve} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS.mauve} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip
                formatter={(v: number) => [v, 'Recettes']}
                labelFormatter={(l) => `Date : ${l}`}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke={COLORS.mauve}
                strokeWidth={2.5}
                fill="url(#colorCount)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Bottom charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top categories */}
        <div className="card-brutal bg-off-white p-5">
          <h3 className="font-black text-deep-black mb-4">Top catégories</h3>
          {stats.topCategories.length === 0 ? (
            <p className="text-deep-black/40 text-sm text-center py-8">Aucune donnée</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.topCategories} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
                <XAxis dataKey="category" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip formatter={(v: number) => [v, 'Générations']} />
                <Bar dataKey="count" fill={COLORS.orange} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Auth vs Anon */}
        <div className="card-brutal bg-off-white p-5">
          <h3 className="font-black text-deep-black mb-4">Auth vs Anonymes</h3>
          {pieData[0].value + pieData[1].value === 0 ? (
            <p className="text-deep-black/40 text-sm text-center py-8">Aucune donnée</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  <Cell fill={COLORS.mauve} />
                  <Cell fill={COLORS.orange} />
                </Pie>
                <Tooltip formatter={(v: number) => [v.toLocaleString('fr-FR'), '']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
