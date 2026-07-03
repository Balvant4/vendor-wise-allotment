'use client';
import { useEffect, useRef, useState } from 'react';
import { Bell, AlertTriangle, AlertCircle, Info, CheckCheck } from 'lucide-react';
import { cn, fmtDateTime } from '@/lib/utils';
import {
  useUnreadNotificationCount,
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  type NotificationItem,
} from '@/features/notifications/hooks/useNotifications';
import EmptyState from '@/components/shared/EmptyState';

const SEVERITY_ICON = {
  critical: AlertCircle,
  warning: AlertTriangle,
  info: Info,
} as const;

const SEVERITY_COLOR = {
  critical: 'text-red',
  warning: 'text-orange-400',
  info: 'text-muted',
} as const;

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: countData } = useUnreadNotificationCount();
  const { data, isLoading } = useNotifications({ page: 1 });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const unreadCount = countData?.unreadCount ?? 0;
  const items = data?.items ?? [];

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  const handleItemClick = (item: NotificationItem) => {
    if (!item.isRead) markRead.mutate(item._id);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-7 w-7 items-center justify-center rounded-lg
                   border border-line bg-panel2 text-muted transition-all hover:text-gold"
        aria-label="Notifications"
      >
        <Bell size={13} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-3.5 min-w-[14px] items-center justify-center
                            rounded-full bg-red px-0.5 text-[9px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-9 z-50 w-80 max-w-[90vw] rounded-2xl border border-line
                        bg-panel shadow-2xl animate-fade-up overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h3 className="text-xs font-bold text-text">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
                className="flex items-center gap-1 text-[10px] font-semibold text-gold hover:text-gold/80
                           disabled:opacity-50"
              >
                <CheckCheck size={11} />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="px-4 py-8 text-center text-xs text-muted">Loading…</div>
            ) : items.length === 0 ? (
              <EmptyState icon={Bell} title="No notifications" message="You're all caught up." />
            ) : (
              items.map((item) => {
                const Icon = SEVERITY_ICON[item.severity];
                return (
                  <button
                    key={item._id}
                    onClick={() => handleItemClick(item)}
                    className={cn(
                      'flex w-full items-start gap-2.5 border-b border-line px-4 py-3 text-left transition-colors',
                      'hover:bg-panel2',
                      !item.isRead && 'bg-gold/5'
                    )}
                  >
                    <Icon size={14} className={cn('mt-0.5 shrink-0', SEVERITY_COLOR[item.severity])} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-text truncate">{item.title}</span>
                        {!item.isRead && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />}
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-[11px] text-muted">{item.message}</p>
                      <span className="mt-1 block text-[10px] text-muted2">{fmtDateTime(item.createdAt)}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
