const ADMIN_BASE = '/api/admin';

async function adminRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${ADMIN_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Erreur inattendue');
  return data.data as T;
}

// ── Types ──────────────────────────────────────────────────────────────────────
export interface AdminStats {
  totalUsers: number;
  newUsersLast7Days: number;
  newUsersLast30Days: number;
  usersByRole: { USER: number; ADMIN: number };
  totalRecipesGenerated: number;
  recipesLast7Days: number;
  recipesLast30Days: number;
  activeSessionsLast7Days: number;
  authenticatedVsAnonymous: { authenticated: number; anonymous: number };
  topCategories: Array<{ category: string; count: number }>;
  dailyActivity: Array<{ date: string; count: number }>;
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: 'USER' | 'ADMIN';
  avatarUrl: string | null;
  createdAt: string;
  hasPassword: boolean;
  hasGoogle: boolean;
  hasGoogleAccount: boolean;
  _count: { recipeHistory: number };
}

export interface BlacklistEntry {
  id: string;
  email: string;
  reason: string | null;
  bannedBy: string;
  createdAt: string;
}

export interface UsersPage {
  users: AdminUser[];
  total: number;
  page: number;
  pages: number;
}

export interface ActivityLog {
  id: string;
  type: 'RECIPE_GENERATED' | 'ADMIN_ACTION';
  description: string;
  userId?: string;
  username?: string;
  sessionId?: string;
  meta?: Record<string, unknown>;
  createdAt: string;
}

export interface ActivityPage {
  logs: ActivityLog[];
  total: number;
  page: number;
  pages: number;
}

export interface AdminLog {
  id: string;
  adminId: string;
  adminUsername: string;
  action: string;
  targetId: string | null;
  meta: Record<string, unknown> | null;
  createdAt: string;
}

export interface AdminLogsPage {
  logs: AdminLog[];
  total: number;
  page: number;
  pages: number;
}

// ── API calls ─────────────────────────────────────────────────────────────────
export async function fetchAdminStats(): Promise<AdminStats> {
  return adminRequest<AdminStats>('/stats');
}

export async function fetchAdminUsers(params: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
}): Promise<UsersPage> {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  if (params.search) qs.set('search', params.search);
  if (params.role) qs.set('role', params.role);
  return adminRequest<UsersPage>(`/users?${qs}`);
}

export async function patchUserRole(userId: string, role: 'USER' | 'ADMIN'): Promise<void> {
  await adminRequest(`/users/${userId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
}

export async function fetchAdminActivity(params: {
  page?: number;
  limit?: number;
  from?: string;
  to?: string;
}): Promise<ActivityPage> {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  if (params.from) qs.set('from', params.from);
  if (params.to) qs.set('to', params.to);
  return adminRequest<ActivityPage>(`/activity?${qs}`);
}

export async function fetchAdminLogs(params: { page?: number; limit?: number }): Promise<AdminLogsPage> {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  return adminRequest<AdminLogsPage>(`/logs?${qs}`);
}

export async function adminGetUsers(): Promise<AdminUser[]> {
  const data = await adminRequest<{ users: AdminUser[] }>('/users');
  return data.users;
}

export async function adminDeleteUser(id: string): Promise<void> {
  await adminRequest(`/users/${id}`, { method: 'DELETE' });
}

export async function adminGetBlacklist(): Promise<BlacklistEntry[]> {
  const data = await adminRequest<{ entries: BlacklistEntry[] }>('/blacklist');
  return data.entries;
}

export async function adminAddBlacklist(email: string, reason?: string): Promise<BlacklistEntry> {
  const data = await adminRequest<{ entry: BlacklistEntry }>('/blacklist', {
    method: 'POST',
    body: JSON.stringify({ email, reason }),
  });
  return data.entry;
}

export async function adminRemoveBlacklist(id: string): Promise<void> {
  await adminRequest(`/blacklist/${id}`, { method: 'DELETE' });
}
