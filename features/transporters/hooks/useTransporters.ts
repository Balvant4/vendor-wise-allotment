import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import { buildQuery } from '@/lib/utils';
import { useApiMutation } from '@/hooks/useApiMutation';
import type { TransporterFormInput, TransporterMapping, TransportersListFilters } from '../types';
import { TRANSPORTERS_PAGE_SIZE } from '../types';

interface TransportersListResponse {
  data: TransporterMapping[];
  pagination: { total: number; totalPages: number };
}

/** Paginated + filtered list of transporter mappings. */
export function useTransportersList(filters: TransportersListFilters) {
  const { search, fixFilter, reviewOnly, showDeleted, page } = filters;

  return useQuery<TransportersListResponse>({
    queryKey: ['transporters', search, fixFilter, reviewOnly, showDeleted, page],
    queryFn: async () => {
      const { data } = await api.get(
        `/transporters${buildQuery({
          search: search || undefined,
          isFix: fixFilter || undefined,
          needsReview: reviewOnly ? 'true' : undefined,
          deletedOnly: showDeleted ? 'true' : undefined,
          page,
          limit: TRANSPORTERS_PAGE_SIZE,
        })}`
      );
      return data;
    },
    placeholderData: (prev) => prev,
  });
}

/** Lightweight, separately-polled count for the "N need review" badge. */
export function useTransportersReviewCount() {
  const { data } = useQuery({
    queryKey: ['transporters', 'review-count'],
    queryFn: async () => {
      const { data } = await api.get('/transporters?needsReview=true&limit=1');
      return data;
    },
    refetchInterval: 30_000,
  });
  return data?.pagination?.total ?? 0;
}

export function useSaveTransporter(editing: TransporterMapping | null, onSaved: () => void) {
  const isEdit = !!editing;

  return useApiMutation<unknown, TransporterFormInput>(
    (form) => (isEdit ? api.patch(`/transporters/${editing!._id}`, form) : api.post('/transporters', form)),
    {
      invalidateKey: ['transporters'],
      successMessage: isEdit ? 'Mapping updated' : 'Mapping added',
      onSuccess: onSaved,
    }
  );
}

export function useDeleteTransporter(onDeleted: () => void) {
  return useApiMutation<unknown, string>((id) => api.delete(`/transporters/${id}`), {
    invalidateKey: ['transporters'],
    successMessage: 'Mapping deleted',
    onSuccess: onDeleted,
    // Preserve the original page's simpler "Delete failed" message rather
    // than surfacing a raw server error for this action.
    onError: () => toast.error('Delete failed'),
  });
}

export function useRestoreTransporter() {
  return useApiMutation<unknown, string>((id) => api.put(`/transporters/${id}`), {
    invalidateKey: ['transporters'],
    successMessage: 'Mapping restored',
  });
}
