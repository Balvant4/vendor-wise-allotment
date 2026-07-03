'use client';
import { useEffect, useRef, useState } from 'react';
import { CalendarClock, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DashboardFilters } from '@/types';

type DateField = NonNullable<DashboardFilters['dateField']>;

const FIELD_OPTIONS: { value: DateField; label: string }[] = [
  { value: 'wllWeighIn',       label: 'WLL In' },
  { value: 'wllWeighOut',      label: 'WLL Out' },
  { value: 'loadingStartTime', label: 'Loading Start' },
  { value: 'loadingEndTime',   label: 'Loading End' },
  { value: 'gateInDate',       label: 'Gate In' },
  { value: 'exciseOutDate',    label: 'Excise Out' },
];

export interface DateTimeRangeValue {
  dateFrom: string; // 'YYYY-MM-DDTHH:mm' (datetime-local) or ''
  dateTo: string;
  dateField: DateField;
}

interface Props {
  value: DateTimeRangeValue;
  onChange: (value: DateTimeRangeValue) => void;
}

function fmtShort(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false });
}

// Compact toolbar control: click to open a popover with a timestamp-field
// selector (which of the 6 date/time columns to filter on) plus From/To
// datetime-local inputs. Replaces the old always-visible sidebar calendar —
// same capability, a fraction of the space, and now time-precise instead
// of date-only.
export default function DateTimeRangeFilter({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setDraft(value), [value]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const isActive = !!(value.dateFrom || value.dateTo);
  const fieldLabel = FIELD_OPTIONS.find((f) => f.value === value.dateField)?.label ?? 'WLL In';

  const apply = () => {
    onChange(draft);
    setOpen(false);
  };

  const clear = () => {
    const cleared = { dateFrom: '', dateTo: '', dateField: draft.dateField };
    setDraft(cleared);
    onChange(cleared);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex h-7 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-medium transition-all',
          isActive
            ? 'border-gold/40 bg-gold/10 text-gold'
            : 'border-line bg-panel2 text-muted hover:text-text'
        )}
      >
        <CalendarClock size={12} />
        {isActive ? (
          <span className="whitespace-nowrap">
            {fieldLabel}: {value.dateFrom ? fmtShort(value.dateFrom) : '…'} – {value.dateTo ? fmtShort(value.dateTo) : '…'}
          </span>
        ) : (
          <span>Date &amp; Time Range</span>
        )}
        <ChevronDown size={11} className="opacity-60" />
        {isActive && (
          <X
            size={12}
            className="ml-0.5 text-gold/70 hover:text-red"
            onClick={(e) => { e.stopPropagation(); clear(); }}
          />
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-9 z-50 w-80 rounded-xl border border-line bg-panel p-3.5 shadow-2xl animate-fade-up">
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-muted2">
            Filter By
          </label>
          <div className="mb-3 grid grid-cols-3 gap-1">
            {FIELD_OPTIONS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setDraft((d) => ({ ...d, dateField: f.value }))}
                className={cn(
                  'rounded-md px-1.5 py-1 text-[10px] font-semibold transition-all',
                  draft.dateField === f.value
                    ? 'bg-gold text-black'
                    : 'bg-panel2 text-muted hover:text-text'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-muted2">From</label>
              <input
                type="datetime-local"
                value={draft.dateFrom}
                onChange={(e) => setDraft((d) => ({ ...d, dateFrom: e.target.value }))}
                className="input-field text-xs"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-muted2">To</label>
              <input
                type="datetime-local"
                value={draft.dateTo}
                onChange={(e) => setDraft((d) => ({ ...d, dateTo: e.target.value }))}
                className="input-field text-xs"
              />
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            <button type="button" onClick={clear} className="btn-ghost flex-1 justify-center text-[11px]">
              Clear
            </button>
            <button type="button" onClick={apply} className="btn-primary flex-1 justify-center text-[11px]">
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
