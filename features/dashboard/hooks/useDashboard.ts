import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { buildQuery } from '@/lib/utils';
import type {
  DashboardFilters,
  DashboardOverview,
  VehicleRecord,
} from '@/types';

export function useDashboardOverview(filters: DashboardFilters = {}) {
  return useQuery<DashboardOverview>({
    queryKey: ['dashboard', 'overview', filters],
    queryFn: async () => {
      const { data } = await api.get(`/dashboard${buildQuery({ ...filters, type: 'overview' })}`);
      return data.data;
    },
    placeholderData: (prev) => prev,
  });
}

export function useFilterOptions() {
  return useQuery({
    queryKey: ['dashboard', 'filter-options'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard?type=filter-options');
      return data.data as { years: number[]; months: number[]; divisions: string[]; transporters: string[] };
    },
    staleTime: 1000 * 60 * 10,
  });
}

export function useAlerts(filters: DashboardFilters = {}) {
  return useQuery<VehicleRecord[]>({
    queryKey: ['dashboard', 'alerts', filters],
    queryFn: async () => {
      const { data } = await api.get(`/dashboard${buildQuery({ ...filters, type: 'alerts' })}`);
      return data.data;
    },
    placeholderData: (prev) => prev,
  });
}
