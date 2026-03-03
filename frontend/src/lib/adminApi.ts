const ADMIN_BASE = '/api/admin';

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: 'USER' | 'ADMIN';
  avatarUrl: string | null;
  createdAt: string;
  hasPassword: boolean;
  hasGoogle: boolean;
}

export interface BlacklistEntry {
  id: string;
  email: string;
  reason: string | null;
  bannedBy: string;
  createdAt: string;
}

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
