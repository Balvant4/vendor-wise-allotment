import { type LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  message?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon: Icon, title, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-panel3 ring-1 ring-line">
        <Icon size={24} className="text-muted2" />
      </div>
      <div className="text-center">
        <div className="text-sm font-semibold text-text">{title}</div>
        {message && <div className="text-xs text-muted mt-1 max-w-xs">{message}</div>}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
