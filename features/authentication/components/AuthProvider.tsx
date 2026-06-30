'use client';
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const { data } = await api.get('/auth');
      setUser(data.data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMe(); }, [fetchMe]);

  const login = async (email: string, password: string): Promise<AuthUser> => {
    const { data } = await api.post('/auth?action=login', { email, password });
    setUser(data.data.user);
    return data.data.user;
  };

  const logout = async () => {
    try { await api.post('/auth?action=logout'); } catch {}
    setUser(null);
  };

  const isRole = (...roles: UserRole[]) => roles.includes(user?.role ?? ('' as UserRole));

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
