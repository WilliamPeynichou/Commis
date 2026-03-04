import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart2, Users, Activity, Shield, ShieldOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { StatsPanel } from './AdminDashboard/StatsPanel';
import { UsersPanel } from './AdminDashboard/UsersPanel';
import { ActivityPanel } from './AdminDashboard/ActivityPanel';
import { BlacklistPanel } from './AdminDashboard/BlacklistPanel';

type Tab = 'stats' | 'users' | 'activity' | 'blacklist';

const TABS: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
  { id: 'stats', label: 'Statistiques', icon: <BarChart2 size={15} strokeWidth={2.5} /> },
  { id: 'users', label: 'Utilisateurs', icon: <Users size={15} strokeWidth={2.5} /> },
  { id: 'activity', label: 'Activité', icon: <Activity size={15} strokeWidth={2.5} /> },
  { id: 'blacklist', label: 'Blacklist', icon: <ShieldOff size={15} strokeWidth={2.5} /> },
];

export function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('stats');

  // Double guard — ProtectedAdminRoute handles the first check
  useEffect(() => {
    if (user && user.role !== 'ADMIN') navigate('/', { replace: true });
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-off-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-off-white border-b-3 border-deep-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 text-sm font-bold text-deep-black/60 hover:text-deep-black transition-colors"
            >
              <ArrowLeft size={15} strokeWidth={2.5} />
              Retour
            </button>
            <div className="w-px h-5 bg-deep-black/20" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-dark-orange rounded-lg border-2 border-deep-black flex items-center justify-center">
                <Shield size={13} className="text-white" strokeWidth={3} />
              </div>
              <span className="font-black text-deep-black text-sm">Dashboard Admin</span>
            </div>
          </div>
          {user && (
            <span className="text-xs font-bold text-deep-black/40 hidden sm:block">
              Connecté en tant que <span className="text-dark-orange">{user.username}</span>
            </span>
          )}
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Tab navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-3 border-deep-black rounded-xl whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-deep-black text-off-white'
                  : 'bg-off-white text-deep-black hover:bg-pale-yellow'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Panel */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
        >
          {activeTab === 'stats' && <StatsPanel />}
          {activeTab === 'users' && <UsersPanel />}
          {activeTab === 'activity' && <ActivityPanel />}
          {activeTab === 'blacklist' && <BlacklistPanel />}
        </motion.div>
      </main>
    </div>
  );
}
