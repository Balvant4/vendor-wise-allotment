import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { buildQuery } from '@/lib/utils';

export function useVehicles(filters: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: ['vehicles', filters],
    queryFn: async () => {
      const { data } = await api.get(`/vehicles${buildQuery(filters)}`);
      return data;
    },
    placeholderData: (prev) => prev,
  });
}
