import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import { useApiMutation } from '@/hooks/useApiMutation';
import type { AuthUser } from '@/types';
import type { CreateUserForm } from '../types';

export function useUsersList(search: string) {
  return useQuery({
    queryKey: ['users', search],
    queryFn: async () => {
      const q = search ? `?search=${encodeURIComponent(search)}` : '';
      const { data } = await api.get(`/users${q}`);
      return data.data as AuthUser[];
    },
    placeholderData: (prev) => prev,
  });
}

export function useCreateUser(onCreated: () => void) {
  return useApiMutation<unknown, CreateUserForm>((form) => api.post('/users', form), {
    invalidateKey: ['users'],
    successMessage: 'User created',
    onSuccess: onCreated,
  });
}

export function useDeleteUser(onDeleted: () => void) {
  return useApiMutation<unknown, string>((id) => api.delete(`/users/${id}`), {
    invalidateKey: ['users'],
    successMessage: 'User deleted',
    onSuccess: onDeleted,
    // Preserve the original page's plain "Delete failed" message.
    onError: () => toast.error('Delete failed'),
  });
}

export function useToggleUserActive() {
  return useApiMutation<unknown, { id: string; isActive: boolean }>(
    ({ id, isActive }) => api.patch(`/users/${id}`, { isActive }),
    {
      invalidateKey: ['users'],
      successMessage: 'User updated',
      onError: () => toast.error('Update failed'),
    }
  );
}
