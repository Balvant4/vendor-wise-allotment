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
  // Server and client must render identically on the very first pass, so we
  // always start from the same neutral state (user=null, loading=true) here.
  // The sessionStorage cache is only read inside a useEffect below — effects
  // never run during server rendering or during the client's first paint,
  // only after hydration completes — so it can never cause a mismatch.
  const [user, setUserState]  = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
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
    // Runs once per browser session (guarded against React StrictMode's
    // double-mount in development). First apply any cached user instantly
    // so navigation feels immediate, then verify with the server — this is
    // the post-hydration equivalent of the old synchronous cache read.
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const cached = getCachedUser();
    if (cached) {
      setUserState(cached);
      setLoading(false);
    }
    fetchMe();
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