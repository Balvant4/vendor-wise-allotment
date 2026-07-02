'use client';
import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import api from '@/lib/axios';
import type { AuthUser, UserRole } from '@/types';
import { PERMISSIONS } from '@/types';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refetch: () => Promise<void>;
  isRole: (...roles: UserRole[]) => boolean;
  can: (action: keyof typeof PERMISSIONS) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const SESSION_KEY = 'auth_user';

function getCachedUser(): AuthUser | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

function setCachedUser(user: AuthUser | null): void {
  try {
    if (user) sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
    else sessionStorage.removeItem(SESSION_KEY);
  } catch { /* ignore */ }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Initialise from sessionStorage so client-side navigations never start
  // with user=null — the cached value is set instantly before any render.
  const cached = typeof window !== 'undefined' ? getCachedUser() : null;

  const [user, setUserState]  = useState<AuthUser | null>(cached);
  // If we already have a cached user, start with loading=false so
  // AppShell never shows the spinner on client-side navigation.
  const [loading, setLoading] = useState<boolean>(cached === null);
  const fetchedRef = useRef(false);

  const setUser = (u: AuthUser | null) => {
    setUserState(u);
    setCachedUser(u);
  };

  const fetchMe = useCallback(async () => {
    try {
      const { data } = await api.get('/auth');
      const fetched = data?.data?.user ?? null;
      setUser(fetched);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Always verify with the server once per browser session,
    // but only if we haven't already done so (avoids double-fetching
    // on React StrictMode double-mount in development).
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      fetchMe();
    }
  }, [fetchMe]);

  const login = async (email: string, password: string): Promise<AuthUser> => {
    const { data } = await api.post('/auth?action=login', { email, password });
    const loggedInUser = data?.data?.user ?? null;
    setUser(loggedInUser);
    return loggedInUser;
  };

  const logout = async () => {
    try { await api.post('/auth?action=logout'); } catch { /* ignore */ }
    setUser(null);
  };

  const isRole = (...roles: UserRole[]): boolean =>
    roles.includes(user?.role ?? ('' as UserRole));

  const can = (action: keyof typeof PERMISSIONS): boolean => {
    if (!user) return false;
    return (PERMISSIONS[action] as UserRole[]).includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refetch: fetchMe, isRole, can }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}