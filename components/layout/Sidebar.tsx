'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Upload, Truck, AlertTriangle,
  BarChart2, Settings, Users, LogOut, Activity, LogIn, X, Package,
} from 'lucide-react';
import { useAuth } from '@/features/authentication/components/AuthProvider';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const navItems = [
  { href: '/dashboard',       label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/vehicles',        label: 'Data Table',   icon: Truck },
  { href: '/alerts',          label: 'Alerts',       icon: AlertTriangle },
  { href: '/upload',          label: 'Upload',       icon: Upload,   roles: ['admin','manager','associate'] },
  { href: '/division',        label: 'By Division',  icon: BarChart2 },
  { href: '/vendors',         label: 'Vendors',      icon: Activity },
  { href: '/settings',              label: 'Settings',     icon: Settings, roles: ['admin','manager','associate','user'] },
  { href: '/settings/transporters', label: 'Transporters', icon: Truck,    roles: ['admin', 'manager'] },
  { href: '/settings/users',        label: 'Users',        icon: Users,    roles: ['admin'] },
] as const;

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ mobileOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, logout, isRole } = useAuth();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    router.push('/login');
  };

  // Without a user, role-gated items (Upload, Settings, Transporters, Users)
  // are hidden automatically since isRole('') never matches any real role.
  const filtered = navItems.filter(
    (item) => !('roles' in item) || item.roles.some((r) => isRole(r))
  );

  const content = (
    <>
      {/* Logo / Branding */}
      <div className="flex items-center gap-2.5 border-b border-line px-4 py-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold/15 ring-1 ring-gold/30">
          <Package size={16} className="text-gold" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-xs font-bold text-text leading-tight">Welspun Living</div>
          <div className="truncate text-[10px] text-muted">Export Control Tower</div>
        </div>
        <button
          onClick={onClose}
          className="ml-auto flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:text-text lg:hidden"
          aria-label="Close menu"
        >
          <X size={16} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {filtered.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-all',
                active
                  ? 'bg-gold/15 text-gold ring-1 ring-gold/20'
                  : 'text-muted hover:bg-panel2 hover:text-text'
              )}
            >
              <Icon size={15} className={active ? 'text-gold' : ''} />
              {label}
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-gold" />}
            </Link>
          );
        })}
      </nav>

      {/* User footer — shows real identity + logout when signed in,
          or a Sign In prompt for guests browsing public pages */}
      <div className="border-t border-line p-3">
        {user ? (
          <>
            <div className="mb-2 flex items-center gap-2 rounded-lg bg-panel2 px-2.5 py-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gold/20 text-[11px] font-bold text-gold">
                {user.name?.[0]?.toUpperCase() ?? 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="truncate text-xs font-semibold text-text">{user.name}</div>
                <div className="truncate text-[10px] capitalize text-muted">{user.role}</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-muted
                         transition-all hover:bg-red/10 hover:text-red"
            >
              <LogOut size={13} /> Logout
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 rounded-lg bg-gold/15 px-3 py-2
                       text-xs font-semibold text-gold ring-1 ring-gold/30 transition-all hover:bg-gold/25"
          >
            <LogIn size={13} /> Sign In
          </Link>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Desktop — permanent sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-56 flex-col border-r border-line bg-panel lg:flex">
        {content}
      </aside>

      {/* Mobile — off-canvas drawer + backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-50 lg:hidden transition-opacity duration-200',
          mobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        )}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <aside
          className={cn(
            'absolute inset-y-0 left-0 flex w-64 max-w-[85vw] flex-col border-r border-line bg-panel',
            'transition-transform duration-200',
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          {content}
        </aside>
      </div>
    </>
  );
}
