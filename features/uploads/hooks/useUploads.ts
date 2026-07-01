import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import toast from 'react-hot-toast';

export function useUploads(page = 1) {
  return useQuery({
    queryKey: ['uploads', page],
    queryFn: async () => {
      const { data } = await api.get(`/uploads?page=${page}&limit=20`);
      return data;
    },
  });
}

export function useUploadFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ file }: { file: File }) => {
      const form = new FormData();
      form.append('file', file);
      const { data } = await api.post('/uploads', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
    onSuccess: () => {
      toast.success('File processed successfully');
      qc.invalidateQueries({ queryKey: ['uploads'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['vehicles'] });
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      toast.error(e?.response?.data?.message ?? e?.message ?? 'Upload failed');
    },
  });
}

export function useDeleteUpload() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/uploads/${id}`);
    },
    onSuccess: () => {
      toast.success('Upload deleted');
      qc.invalidateQueries({ queryKey: ['uploads'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['vehicles'] });
    },
    onError: () => toast.error('Delete failed'),
  });
}
