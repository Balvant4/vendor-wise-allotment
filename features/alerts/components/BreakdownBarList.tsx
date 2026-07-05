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
  /** Fixed Tailwind height class (e.g. "h-64") for the list area. Keeps this
   * card the same height as its siblings in a grid row no matter how many
   * items it has, scrolling internally instead of stretching the card. */
  listHeightClass?: string;
}

function Row({ item, index, max, barColorClass }: { item: BreakdownItem; index: number; max: number; barColorClass: string }) {
  return (
    <div className="group rounded-md px-1.5 py-1.5 -mx-1.5 transition-colors hover:bg-panel2/60">
      <div className="flex items-center justify-between text-xs mb-1 gap-2">
        <span className="flex items-center gap-2 min-w-0">
          <span className="shrink-0 w-4 text-[10px] font-mono text-muted2">{index + 1}</span>
          <span className="truncate text-text font-medium">{item.label}</span>
        </span>
        <span className="shrink-0 font-mono text-muted">{item.sublabel ?? item.value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-panel2 overflow-hidden ml-6">
        <div
          className={`h-full rounded-full ${barColorClass} transition-all`}
          style={{ width: `${(item.value / max) * 100}%` }}
        />
      </div>
    </div>
  );
}

function BreakdownBarList({
  icon: Icon, iconColorClass, barColorClass, title, items,
  loading, emptyMessage = 'No data for this range.', skeletonRows = 4,
  listHeightClass,
}: BreakdownBarListProps) {
  const max = Math.max(1, ...items.map((i) => i.value));

  return (
    <div className="panel-card flex flex-col">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon size={14} className={iconColorClass} />
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted">{title}</h3>
        </div>
        {!loading && items.length > 0 && (
          <span className="text-[10px] font-mono text-muted2">{items.length}</span>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: skeletonRows }).map((_, i) => (
            <div key={i} className="skeleton h-6 rounded" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-xs text-muted2 italic">{emptyMessage}</p>
      ) : listHeightClass ? (
        <div className="relative">
          <div className={`${listHeightClass} overflow-y-auto pr-1`}>
            {items.map((item, i) => (
              <Row key={item.key} item={item} index={i} max={max} barColorClass={barColorClass} />
            ))}
          </div>
          <div className="pointer-events-none absolute bottom-0 left-0 right-1 h-5 bg-gradient-to-t from-panel to-transparent" />
        </div>
      ) : (
        <div>
          {items.map((item, i) => (
            <Row key={item.key} item={item} index={i} max={max} barColorClass={barColorClass} />
          ))}
        </div>
      )}
    </div>
  );
}

export default memo(BreakdownBarList);