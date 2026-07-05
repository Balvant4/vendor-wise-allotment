import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { buildQuery } from '@/lib/utils';
import type { DashboardFilters, DashboardOverview, DailyTrend, DashboardKPIs } from '@/types';
import type { MonthInsights } from '@/server/services/current-month.service';

const pad = (n: number) => String(n).padStart(2, '0');
const toLocalDateTime = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

/**
 * 1st of the current month, 00:00 → right now. Recomputed fresh every call —
 * nothing here is hardcoded to "this" month, so it silently rolls over at
 * midnight on the 1st without any manual update or deploy.
 */
export function getCurrentMonthRange(): { dateFrom: string; dateTo: string; daysElapsed: number; label: string } {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
  return {
    dateFrom: toLocalDateTime(first),
    dateTo: toLocalDateTime(now),
    daysElapsed: now.getDate(),
    label: now.toLocaleString('en-IN', { month: 'long', year: 'numeric' }),
  };
}

/** Same window, shifted back one calendar month, capped to the same number
 * of elapsed days — powers the "vs last month" growth comparison so it's
 * an apples-to-apples (day 1–18 vs day 1–18) comparison rather than a full
 * month vs a partial one. */
export function getPreviousMonthRange(): { dateFrom: string; dateTo: string } {
  const now = new Date();
  const firstThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDayPrevMonthDate = new Date(firstThisMonth.getTime() - 86400000);
  const firstPrevMonth = new Date(lastDayPrevMonthDate.getFullYear(), lastDayPrevMonthDate.getMonth(), 1, 0, 0, 0);
  const cappedDay = Math.min(now.getDate(), lastDayPrevMonthDate.getDate());
  const cappedEnd = new Date(firstPrevMonth.getFullYear(), firstPrevMonth.getMonth(), cappedDay, 23, 59);
  return { dateFrom: toLocalDateTime(firstPrevMonth), dateTo: toLocalDateTime(cappedEnd) };
}

// ── Overview (KPIs, by-division, by-transporter, by-day-of-week, monthly) ──
// Reuses the existing /api/dashboard?type=overview endpoint verbatim — no
// new backend aggregation needed for any of this.
export function useCurrentMonthOverview() {
  const { dateFrom, dateTo } = getCurrentMonthRange();
  const filters: DashboardFilters = { dateField: 'wllWeighIn', dateFrom, dateTo };
  return useQuery<DashboardOverview>({
    queryKey: ['current-month', 'overview', filters],
    queryFn: async () => {
      const { data } = await api.get(`/dashboard${buildQuery({ ...filters, type: 'overview' })}`);
      return data.data;
    },
    placeholderData: (prev) => prev,
    refetchInterval: 5 * 60 * 1000, // keep "today" fresh through the working day
  });
}

// ── Daily trend, fetched separately from the overview above ──
// dashboardService.getDailyTrend() always widens its $gte to `now - days`
// (see server/services/dashboard.service.ts) — passing days=daysElapsed
// makes that widened bound land exactly on the 1st of this month, so the
// existing endpoint returns a correct current-month-only series without
// any backend change.
export function useCurrentMonthDaily() {
  const { dateFrom, dateTo, daysElapsed } = getCurrentMonthRange();
  const filters: DashboardFilters = { dateField: 'wllWeighIn', dateFrom, dateTo };
  return useQuery<DailyTrend[]>({
    queryKey: ['current-month', 'daily', filters, daysElapsed],
    queryFn: async () => {
      const { data } = await api.get(
        `/dashboard${buildQuery({ ...filters, type: 'daily', days: Math.max(daysElapsed, 1) })}`
      );
      return data.data;
    },
    placeholderData: (prev) => prev,
  });
}

// ── Previous month's KPIs, for the growth-vs-last-month comparison ──
export function usePreviousMonthKpis() {
  const { dateFrom, dateTo } = getPreviousMonthRange();
  const filters: DashboardFilters = { dateField: 'wllWeighIn', dateFrom, dateTo };
  return useQuery<DashboardKPIs>({
    queryKey: ['current-month', 'previous-kpis', filters],
    queryFn: async () => {
      const { data } = await api.get(`/dashboard${buildQuery({ ...filters, type: 'kpis' })}`);
      return data.data;
    },
    staleTime: 1000 * 60 * 30,
  });
}

// ── The one genuinely new aggregation (/api/current-month) ──
export function useCurrentMonthInsights() {
  const { dateFrom, dateTo } = getCurrentMonthRange();
  const filters: DashboardFilters = { dateField: 'wllWeighIn', dateFrom, dateTo };
  return useQuery<MonthInsights>({
    queryKey: ['current-month', 'insights', filters],
    queryFn: async () => {
      const { data } = await api.get(`/current-month${buildQuery({ ...filters, type: 'insights' })}`);
      return data.data;
    },
    placeholderData: (prev) => prev,
  });
}