'use client';
import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from 'lucide-react';
import { DAYS, MONTHS } from '@/lib/utils';

interface DateRangePickerProps {
  value: string; // 'YYYY-MM-DD' or ''
  onChange: (date: string) => void;
  className?: string;
}

function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Single-day calendar picker used by the Data Table page. Deliberately
// self-contained (no external date library) — click the field to open a
// month-grid popover, click a day to select, click outside to close.
export default function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = value ? new Date(value + 'T00:00:00') : null;
  const [viewDate, setViewDate] = useState(selected ?? new Date());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array.from({ length: startWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const today = new Date();
  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  const isSelected = (day: number) =>
    !!selected && day === selected.getDate() && month === selected.getMonth() && year === selected.getFullYear();

  const pick = (day: number) => {
    onChange(toISO(new Date(year, month, day)));
    setOpen(false);
  };

  return (
    <div className={className} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="input-field flex items-center justify-between gap-2 text-left"
      >
        <span className="flex items-center gap-2 truncate">
          <CalendarIcon size={13} className="text-muted shrink-0" />
          {selected
            ? selected.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
            : <span className="text-muted2">Select a date…</span>}
        </span>
        {value && (
          <X
            size={13}
            className="text-muted2 hover:text-red shrink-0"
            onClick={(e) => { e.stopPropagation(); onChange(''); }}
          />
        )}
      </button>

      {open && (
        <div className="absolute z-40 mt-1.5 w-72 rounded-xl border border-line bg-panel p-3 shadow-2xl animate-fade-up">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setViewDate(new Date(year, month - 1, 1))}
              className="btn-ghost p-1"
            >
              <ChevronLeft size={13} />
            </button>
            <span className="text-xs font-bold text-text">{MONTHS[month]} {year}</span>
            <button
              type="button"
              onClick={() => setViewDate(new Date(year, month + 1, 1))}
              className="btn-ghost p-1"
            >
              <ChevronRight size={13} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-[9px] font-bold uppercase text-muted2 py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => (
              <button
                key={i}
                type="button"
                disabled={day === null}
                onClick={() => day && pick(day)}
                className={`h-7 rounded-md text-[11px] font-medium transition-all
                  ${day === null ? 'invisible' : ''}
                  ${isSelected(day ?? -1)
                    ? 'bg-gold text-black font-bold'
                    : isToday(day ?? -1)
                      ? 'ring-1 ring-gold/40 text-gold'
                      : 'text-muted hover:bg-panel2 hover:text-text'}`}
              >
                {day}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => { onChange(toISO(today)); setViewDate(today); setOpen(false); }}
            className="btn-ghost w-full mt-2 justify-center text-[10px]"
          >
            Today
          </button>
        </div>
      )}
    </div>
  );
}
