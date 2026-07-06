import { useMutation, useQueryClient, type QueryKey, type UseMutationOptions } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/lib/utils';

interface UseApiMutationOptions<TData, TVars>
  extends Omit<UseMutationOptions<TData, unknown, TVars>, 'mutationFn' | 'onSuccess' | 'onError'> {
  /** Query key(s) to invalidate after a successful mutation. */
  invalidateKey: QueryKey;
  /** Static string, or a function of the response, for the success toast. Omit to skip the toast. */
  successMessage?: string | ((data: TData, vars: TVars) => string);
  /** Extra logic to run after the toast/invalidate (closing a modal, resetting a field, etc). */
  onSuccess?: (data: TData, vars: TVars) => void;
  /** Override the default toast.error(getErrorMessage(err)) behavior. */
  onError?: (err: unknown, vars: TVars) => void;
}

/**
 * Wraps react-query's useMutation with the toast + invalidateQueries + error
 * handling shape that was previously copy-pasted into every settings page
 * (transporters, users, ...). New CRUD screens get consistent behavior for
 * free instead of re-deriving it from `err?.response?.data?.message` each time.
 */
export function useApiMutation<TData, TVars = void>(
  mutationFn: (vars: TVars) => Promise<TData>,
  { invalidateKey, successMessage, onSuccess, onError, ...rest }: UseApiMutationOptions<TData, TVars>
) {
  const qc = useQueryClient();

  return useMutation<TData, unknown, TVars>({
    ...rest,
    mutationFn,
    onSuccess: (data, vars) => {
      const message = typeof successMessage === 'function' ? successMessage(data, vars) : successMessage;
      if (message) toast.success(message);
      qc.invalidateQueries({ queryKey: invalidateKey });
      onSuccess?.(data, vars);
    },
    onError: (err, vars) => {
      if (onError) { onError(err, vars); return; }
      toast.error(getErrorMessage(err));
    },
  });
}
