import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { apiMe, apiLogin, apiRegister, apiLogout, apiExchange, getGoogleAuthUrl } from '../lib/authApi';
import type { User } from '../lib/authApi';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: () => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // true until first /me check

  const refreshUser = useCallback(async () => {
    try {
      const u = await apiMe();
      setUser(u);
    } catch {
      setUser(null);
    }
  }, []);

  // Check auth state on mount and after Google OAuth redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authResult = params.get('auth');
    const exchangeToken = params.get('t');

    const init = async () => {
      if (authResult === 'success' && exchangeToken) {
        // Exchange the one-time OAuth token for a real session cookie.
        // This request goes through the frontend proxy so the cookie is set
        // on the frontend's domain (not the backend's).
        try {
          const u = await apiExchange(exchangeToken);
          setUser(u);
        } catch {
          setUser(null);
        }
      } else {
        await refreshUser();
      }
      setIsLoading(false);
      // Clean query params from the URL without a reload
      if (authResult || exchangeToken) {
        const url = new URL(window.location.href);
        url.searchParams.delete('auth');
        url.searchParams.delete('t');
        window.history.replaceState({}, '', url.toString());
      }
    };
    init();
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const u = await apiLogin(email, password);
    setUser(u);
  }, []);

  const register = useCallback(async (username: string, email: string, password: string) => {
    const u = await apiRegister(username, email, password);
    setUser(u);
  }, []);

  const loginWithGoogle = useCallback(() => {
    window.location.href = getGoogleAuthUrl();
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, loginWithGoogle, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
