'use client';
import { useAuth } from '@/features/authentication/components/AuthProvider';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import Footer from './Footer';

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  requireAuth?: boolean;
}

export default function AppShell({ children, title, requireAuth = false }: AppShellProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!loading && requireAuth && !user) router.replace('/login');
  }, [user, loading, requireAuth, router]);

  // Close the mobile drawer automatically on navigation.
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

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
      <Sidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="flex flex-1 flex-col min-w-0 lg:pl-56">
        <TopBar title={title} onMenuClick={() => setMobileNavOpen(true)} />
        <main className="flex-1 overflow-auto p-3 sm:p-4 lg:p-5">{children}</main>
        <Footer />
      </div>
    </div>
  );
}