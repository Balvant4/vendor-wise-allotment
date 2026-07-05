'use client';
import { Search, Menu, SlidersHorizontal, X, RotateCcw } from 'lucide-react';
import { useAuth } from '@/features/authentication/components/AuthProvider';
import { useFilters } from '@/features/dashboard/components/FilterProvider';
import { useFilterOptions } from '@/features/dashboard/hooks/useDashboard';
import { MONTHS } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import NotificationBell from '@/components/layout/NotificationBell';

interface TopBarProps {
  title?: string;
  onMenuClick?: () => void;
}

export default function TopBar({ title = 'Dashboard', onMenuClick }: TopBarProps) {
  const { user } = useAuth();
  const { filters, setFilter, resetFilters } = useFilters();
  const { data: opts } = useFilterOptions();
  const [filtersOpen, setFiltersOpen] = useState(false);

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

  const years       = opts?.years       ?? [];
  const divisions    = opts?.divisions    ?? [];
  const transporters = opts?.transporters ?? [];

  const handleClearFilters = () => {
    resetFilters();
    setLocalSearch('');
  };

  const activeFilterCount = [
    filters.division,
    filters.transporter,
    filters.isFix,
  ].filter(Boolean).length;

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 sm:gap-3 border-b border-line
                       bg-bg/90 backdrop-blur-md px-3 sm:px-5">
      {/* Mobile hamburger */}
      <button
        onClick={onMenuClick}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:text-text lg:hidden shrink-0"
        aria-label="Open menu"
      >
        <Menu size={18} />
      </button>

      <h1 className="text-sm font-bold text-text mr-2 truncate">{title}</h1>

      <div className="flex items-center gap-1.5 ml-auto">
        {/* Search — always present, shrinks on small screens instead of disappearing.
            Matches vehicle no, container no, document no, transporter, division,
            customer name, and dates (dd-mm-yyyy / dd/mm/yyyy / yyyy-mm-dd) — see
            server/queries/vehicle.queries.ts for the matching logic. Placeholder
            and title both spell this out since the box itself is too narrow to
            show the full hint at once, especially on mobile widths. */}
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted2 pointer-events-none" />
          <input
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Vehicle, container, transporter, date (dd-mm-yyyy)…"
            title="Search by vehicle no, container no, document no, transporter, division, customer name, or date — type a date as dd-mm-yyyy, dd/mm/yyyy, or yyyy-mm-dd"
            className="h-7 w-20 xs:w-28 sm:w-36 md:w-48 rounded-lg border border-line bg-panel2 pl-7 pr-2 text-xs
                       text-text placeholder:text-muted2 outline-none focus:border-gold
                       focus:ring-1 focus:ring-gold/10 transition-all"
          />
        </div>

        {/* Year — always visible, it's compact */}
        <select
          value={filters.year}
          onChange={(e) => setFilter('year', e.target.value)}
          className="fb-select h-7 text-xs"
        >
          <option value="">All years</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>

        {/* Month — always visible, it's compact */}
        <select
          value={filters.month}
          onChange={(e) => setFilter('month', e.target.value)}
          className="fb-select h-7 text-xs hidden xs:block"
        >
          <option value="">All months</option>
          {MONTHS.map((m, i) => (
            <option key={i} value={i + 1}>{m}</option>
          ))}
        </select>

        {/* Division + Transporter + Fix toggle — collapse into a filter drawer below their
            breakpoints, so they stay reachable on mobile instead of disappearing entirely */}
        <select
          value={filters.division}
          onChange={(e) => setFilter('division', e.target.value)}
          className="fb-select h-7 text-xs hidden md:block"
        >
          <option value="">All divisions</option>
          {divisions.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>

        <select
          value={filters.transporter}
          onChange={(e) => setFilter('transporter', e.target.value)}
          className="fb-select h-7 text-xs hidden lg:block"
        >
          <option value="">All transporters</option>
          {transporters.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>

        <select
          value={filters.isFix}
          onChange={(e) => setFilter('isFix', e.target.value)}
          className="fb-select h-7 text-xs hidden lg:block"
        >
          <option value="">Fix + Non-Fix</option>
          <option value="true">Fix Only</option>
          <option value="false">Non-Fix Only</option>
        </select>

        {/* Clear all filters */}
        {(activeFilterCount > 0 || filters.search) && (
          <button
            onClick={handleClearFilters}
            title="Clear all filters"
            className="flex h-7 items-center gap-1 rounded-lg border border-line bg-panel2 px-2
                       text-muted transition-all hover:text-gold"
          >
            <RotateCcw size={13} />
          </button>
        )}

        {/* More filters button — visible below md (division) and below lg (transporter/fix toggle) */}
        <button
          onClick={() => setFiltersOpen(true)}
          className="relative flex h-7 items-center gap-1 rounded-lg border border-line bg-panel2 px-2
                     text-muted transition-all hover:text-gold lg:hidden"
        >
          <SlidersHorizontal size={13} />
          {activeFilterCount > 0 && (
            <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-gold text-[9px] font-bold text-black">
              {activeFilterCount}
            </span>
          )}
        </button>

        {user && <NotificationBell />}

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

      {/* Filter drawer — division + transporter + fix toggle + month, reachable on any screen size */}
      {filtersOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setFiltersOpen(false)} />
          <div className="relative z-10 w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl border border-line bg-panel p-5 shadow-2xl animate-fade-up">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-text">More Filters</h3>
              <button onClick={() => setFiltersOpen(false)} className="text-muted hover:text-text">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-muted2">Month</label>
                <select
                  value={filters.month}
                  onChange={(e) => setFilter('month', e.target.value)}
                  className="input-field text-xs"
                >
                  <option value="">All months</option>
                  {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-muted2">Division</label>
                <select
                  value={filters.division}
                  onChange={(e) => setFilter('division', e.target.value)}
                  className="input-field text-xs"
                >
                  <option value="">All divisions</option>
                  {divisions.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-muted2">Transporter</label>
                <select
                  value={filters.transporter}
                  onChange={(e) => setFilter('transporter', e.target.value)}
                  className="input-field text-xs"
                >
                  <option value="">All transporters</option>
                  {transporters.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-muted2">Load Type</label>
                <select
                  value={filters.isFix}
                  onChange={(e) => setFilter('isFix', e.target.value)}
                  className="input-field text-xs"
                >
                  <option value="">Fix + Non-Fix</option>
                  <option value="true">Fix Only</option>
                  <option value="false">Non-Fix Only</option>
                </select>
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button onClick={handleClearFilters} className="btn-ghost flex-1 justify-center">
                Clear all
              </button>
              <button onClick={() => setFiltersOpen(false)} className="btn-primary flex-1 justify-center">
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}