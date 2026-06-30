'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Upload, Truck, AlertTriangle,
  BarChart2, Settings, Users, LogOut, Activity,
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
  { href: '/settings',              label: 'Settings',     icon: Settings },
  { href: '/settings/transporters', label: 'Transporters', icon: Truck,   roles: ['admin', 'manager'] },
  { href: '/settings/users',        label: 'Users',        icon: Users,   roles: ['admin'] },
] as const;

export default function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, logout, isRole } = useAuth();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    router.push('/login');
  };

  const filtered = navItems.filter(
    (item) => !('roles' in item) || item.roles.some((r) => isRole(r))
  );

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-56 flex-col border-r border-line bg-panel">
      {/* Logo */}
      <div className="flex items-center gap-2.5 border-b border-line px-4 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/15 ring-1 ring-gold/30">
          <Truck size={16} className="text-gold" />
        </div>
        <div>
          <div className="text-xs font-bold text-text leading-tight">Vendor Control</div>
          <div className="text-[10px] text-muted">Movement Tower</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {filtered.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
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

      {/* User footer */}
      <div className="border-t border-line p-3">
        <div className="mb-2 flex items-center gap-2 rounded-lg bg-panel2 px-2.5 py-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gold/20 text-[11px] font-bold text-gold">
            {user?.name?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="truncate text-xs font-semibold text-text">{user?.name ?? 'User'}</div>
            <div className="truncate text-[10px] capitalize text-muted">{user?.role}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-muted
                     transition-all hover:bg-red/10 hover:text-red"
        >
          <LogOut size={13} /> Logout
        </button>
      </div>
    </aside>
  );
}
