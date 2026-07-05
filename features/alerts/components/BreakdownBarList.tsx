import { memo } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface BreakdownItem {
  key: string;
  label: string;
  /** Drives bar width, relative to the largest value in the list. */
  value: number;
  /** Text shown on the right, e.g. "12 · 340.5h". Falls back to `value`. */
  sublabel?: string;
}

interface BreakdownBarListProps {
  icon: LucideIcon;
  iconColorClass: string;
  barColorClass: string;
  title: string;
  items: BreakdownItem[];
  loading?: boolean;
  emptyMessage?: string;
  skeletonRows?: number;
}

function BreakdownBarList({
  icon: Icon, iconColorClass, barColorClass, title, items,
  loading, emptyMessage = 'No data for this range.', skeletonRows = 4,
}: BreakdownBarListProps) {
  const max = Math.max(1, ...items.map((i) => i.value));

  return (
    <div className="panel-card">
      <div className="mb-3 flex items-center gap-2">
        <Icon size={14} className={iconColorClass} />
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted">{title}</h3>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: skeletonRows }).map((_, i) => (
            <div key={i} className="skeleton h-6 rounded" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-xs text-muted2 italic">{emptyMessage}</p>
      ) : (
        <div className="space-y-2.5">
          {items.map((item) => (
            <div key={item.key}>
              <div className="flex items-center justify-between text-xs mb-1 gap-2">
                <span className="truncate text-text font-medium">{item.label}</span>
                <span className="shrink-0 font-mono text-muted">{item.sublabel ?? item.value}</span>
              </div>
              <div className="h-1.5 rounded-full bg-panel2 overflow-hidden">
                <div
                  className={`h-full rounded-full ${barColorClass}`}
                  style={{ width: `${(item.value / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default memo(BreakdownBarList);