'use client';
import { createContext, useContext, useState, type ReactNode } from 'react';
import type { DashboardFilters } from '@/types';

interface FilterContextValue {
  filters: DashboardFilters;
  setFilter: (key: keyof DashboardFilters, value: string) => void;
  setFilters: (f: DashboardFilters) => void;
  resetFilters: () => void;
}

const FilterContext = createContext<FilterContextValue | null>(null);

const now = new Date();
const defaultFilters: DashboardFilters = {
  year:        String(now.getFullYear()),
  month:       String(now.getMonth() + 1),
  division:    '',
  transporter: '',
  isFix:       '',
  dateFrom:    '',
  dateTo:      '',
  search:      '',
};

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<DashboardFilters>(defaultFilters);

  const setFilter = (key: keyof DashboardFilters, value: string) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const resetFilters = () => setFilters({ ...defaultFilters });

  return (
    <FilterContext.Provider value={{ filters, setFilter, setFilters, resetFilters }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters(): FilterContextValue {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error('useFilters must be inside FilterProvider');
  return ctx;
}
