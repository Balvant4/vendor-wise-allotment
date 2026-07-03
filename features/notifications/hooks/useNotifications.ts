import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { buildQuery } from '@/lib/utils';
import { useAuth } from '@/features/authentication/components/AuthProvider';

export interface NotificationItem {
  _id: string;
  type: 'sla_violation' | 'upload_completed' | 'upload_failed';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  uploadId?: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationsResponse {
  items: NotificationItem[];
  unreadCount: number;
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

const POLL_MS = 30_000;

// Cheap poll — used to drive the badge count without pulling the full list.
export function useUnreadNotificationCount() {
  const { user } = useAuth();
  return useQuery<{ unreadCount: number }>({
    queryKey: ['notifications', 'count'],
    queryFn: async () => {
      const { data } = await api.get('/notifications?countOnly=true');
      return data.data;
    },
    enabled: !!user,
    refetchInterval: POLL_MS,
    refetchOnWindowFocus: true,
  });
}

export function useNotifications(params: { unreadOnly?: boolean; page?: number } = {}) {
  const { user } = useAuth();
  return useQuery<NotificationsResponse>({
    queryKey: ['notifications', 'list', params],
    queryFn: async () => {
      const { data } = await api.get(`/notifications${buildQuery(params)}`);
      return data.data;
    },
    enabled: !!user,
    refetchInterval: POLL_MS,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.patch(`/notifications/${id}`);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.patch('/notifications?action=mark-all-read');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
