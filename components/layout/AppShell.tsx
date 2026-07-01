'use client';
import { useAuth } from '@/features/authentication/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  requireAuth?: boolean;
}

export default function AppShell({ children, title, requireAuth = false }: AppShellProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && requireAuth && !user) router.replace('/login');
  }, [user, loading, requireAuth, router]);

  if (loading || (requireAuth && !user)) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-gold" />
          <span className="text-xs text-muted">Loading…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      <div className="flex flex-1 flex-col pl-56 min-w-0">
        <TopBar title={title} />
        <main className="flex-1 overflow-auto p-5">{children}</main>
      </div>
    </div>
  );
}