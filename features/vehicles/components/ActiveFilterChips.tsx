'use client';
import { X } from 'lucide-react';

export interface FilterChip {
  key: string;
  label: string;
  onRemove: () => void;
}

interface Props {
  chips: FilterChip[];
  onResetAll: () => void;
}

// Compact row of removable chips showing exactly what's currently filtered.
// Only renders when there's something active, so it costs zero vertical
// space in the common "no filters applied" case.
export default function ActiveFilterChips({ chips, onResetAll }: Props) {
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 border-t border-line px-1 py-2">
      <span className="text-[10px] font-bold uppercase tracking-wide text-muted2 mr-0.5">Filters:</span>
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="flex items-center gap-1 rounded-full border border-gold/30 bg-gold/10 pl-2.5 pr-1.5 py-1 text-[10px] font-semibold text-gold"
        >
          {chip.label}
          <button
            type="button"
            onClick={chip.onRemove}
            className="flex h-3.5 w-3.5 items-center justify-center rounded-full hover:bg-gold/20"
            aria-label={`Remove ${chip.label} filter`}
          >
            <X size={10} />
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={onResetAll}
        className="ml-1 text-[10px] font-semibold text-muted hover:text-red transition-colors"
      >
        Reset all
      </button>
    </div>
  );
}
