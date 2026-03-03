const AUTH_BASE = '/api/auth';

export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  role: 'USER' | 'ADMIN';
  createdAt: string;
}

interface AuthResponse {
  success: boolean;
  data?: { user: User };
  error?: string;
}

async function authRequest(path: string, body?: unknown, method = 'POST'): Promise<User> {
  const res = await fetch(`${AUTH_BASE}${path}`, {
    method,
    credentials: 'include', // send/receive HttpOnly cookie
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const data: AuthResponse = await res.json();
  if (!data.success || !data.data) throw new Error(data.error || 'Erreur inattendue');
  return data.data.user;
}

export async function apiMe(): Promise<User> {
  return authRequest('/me', undefined, 'GET');
}

export async function apiLogin(email: string, password: string): Promise<User> {
  return authRequest('/login', { email, password });
}

export async function apiRegister(username: string, email: string, password: string): Promise<User> {
  return authRequest('/register', { username, email, password });
}

export async function apiLogout(): Promise<void> {
  await fetch(`${AUTH_BASE}/logout`, { method: 'POST', credentials: 'include' });
}

export function getGoogleAuthUrl(): string {
  return '/api/auth/google';
}
