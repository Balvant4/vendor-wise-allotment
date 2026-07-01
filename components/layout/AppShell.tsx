'use client';
import { useAuth } from '@/features/authentication/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  /**
   * Set true only for pages that must not render at all without a logged-in
   * user (e.g. /upload, /settings/users, /settings/transporters). Most pages
   * (dashboard, vehicles, alerts, division, vendors) are public — visitors
   * can view data without an account, so this defaults to false.
   */
  requireAuth?: boolean;
}

export default function AppShell({ children, title, requireAuth = false }: AppShellProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && requireAuth && !user) router.replace('/login');
  }, [user, loading, requireAuth, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-gold" />
          <span className="text-xs text-muted">Loading…</span>
        </div>
      </div>
    );
  }

  // Page explicitly requires auth and we have none — middleware should have
  // already redirected, but this is the client-side fallback (e.g. for
  // client-side navigation that doesn't re-run middleware).
  if (requireAuth && !user) return null;

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
