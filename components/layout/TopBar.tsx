'use client';
import { Bell, Search } from 'lucide-react';
import { useAuth } from '@/features/authentication/components/AuthProvider';
import { useFilters } from '@/features/dashboard/components/FilterProvider';
import { useFilterOptions } from '@/features/dashboard/hooks/useDashboard';
import { MONTHS } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

interface TopBarProps { title?: string }

export default function TopBar({ title = 'Dashboard' }: TopBarProps) {
  const { user } = useAuth();
  const { filters, setFilter } = useFilters();
  const { data: opts } = useFilterOptions();

  const [localSearch, setLocalSearch] = useState(filters.search ?? '');
  const debounced = useDebounce(localSearch, 400);

  // Track previous debounced value so we only call setFilter when it actually changes.
  // Without this guard, setFilter → state update → re-render → useEffect fires again → infinite loop.
  const prevDebounced = useRef(debounced);
  useEffect(() => {
    if (debounced !== prevDebounced.current) {
      prevDebounced.current = debounced;
      setFilter('search', debounced);
    }
  }, [debounced, setFilter]);

  const years     = opts?.years     ?? [];
  const divisions = opts?.divisions ?? [];

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line
                       bg-bg/90 backdrop-blur-md px-5">
      <h1 className="text-sm font-bold text-text mr-2">{title}</h1>

      <div className="flex items-center gap-1.5 ml-auto">
        {/* Search */}
        <div className="relative hidden sm:block">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted2 pointer-events-none" />
          <input
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search vehicle, container…"
            className="h-7 w-48 rounded-lg border border-line bg-panel2 pl-7 pr-3 text-xs
                       text-text placeholder:text-muted2 outline-none focus:border-gold
                       focus:ring-1 focus:ring-gold/10 transition-all"
          />
        </div>

        {/* Year */}
        <select
          value={filters.year}
          onChange={(e) => setFilter('year', e.target.value)}
          className="fb-select h-7 text-xs"
        >
          <option value="">All years</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>

        {/* Month */}
        <select
          value={filters.month}
          onChange={(e) => setFilter('month', e.target.value)}
          className="fb-select h-7 text-xs"
        >
          <option value="">All months</option>
          {MONTHS.map((m, i) => (
            <option key={i} value={i + 1}>{m}</option>
          ))}
        </select>

        {/* Division */}
        <select
          value={filters.division}
          onChange={(e) => setFilter('division', e.target.value)}
          className="fb-select h-7 text-xs hidden md:block"
        >
          <option value="">All divisions</option>
          {divisions.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>

        {/* Fix toggle */}
        <select
          value={filters.isFix}
          onChange={(e) => setFilter('isFix', e.target.value)}
          className="fb-select h-7 text-xs hidden lg:block"
        >
          <option value="">Fix + Non-Fix</option>
          <option value="true">Fix Only</option>
          <option value="false">Non-Fix Only</option>
        </select>

        <button className="relative flex h-7 w-7 items-center justify-center rounded-lg
                           border border-line bg-panel2 text-muted transition-all hover:text-gold">
          <Bell size={13} />
        </button>

        {user ? (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gold/20
                          text-[11px] font-bold text-gold ring-1 ring-gold/30">
            {user.name?.[0]?.toUpperCase() ?? 'U'}
          </div>
        ) : (
          <Link
            href="/login"
            className="flex h-7 items-center rounded-lg border border-gold/30 bg-gold/10
                       px-2.5 text-[10px] font-semibold text-gold transition-all hover:bg-gold/20"
          >
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}