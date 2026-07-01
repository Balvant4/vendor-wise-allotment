'use client';
import { useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/features/authentication/components/AuthProvider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { fmtDateTime } from '@/lib/utils';
import Badge from '@/components/shared/Badge';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { UserPlus, Pencil, Trash2, Search, ShieldCheck, User as UserIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createUserSchema } from '@/server/validations/auth.validation';
import toast from 'react-hot-toast';
import type { AuthUser, UserRole } from '@/types';
import { z } from 'zod';

const ROLE_COLOR: Record<UserRole, 'red' | 'gold' | 'blue' | 'gray'> = {
  admin:     'red',
  manager:   'gold',
  associate: 'blue',
  user:      'gray',
};

type CreateForm = z.infer<typeof createUserSchema>;

function UserModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm<CreateForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { role: 'user' },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: CreateForm) => api.post('/users', data),
    onSuccess: () => { toast.success('User created'); qc.invalidateQueries({ queryKey: ['users'] }); onClose(); },
    onError: (e: unknown) => {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message ?? 'Failed to create user');
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md animate-fade-up rounded-2xl border border-line bg-panel p-6 shadow-2xl">
        <h3 className="mb-4 text-sm font-bold text-text">Create New User</h3>
        <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-3">
          {(['name', 'email', 'password'] as const).map((field) => (
            <div key={field}>
              <label className="mb-1 block text-xs font-semibold capitalize text-muted">{field}</label>
              <input
                {...register(field)}
                type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'}
                className="input-field"
              />
              {errors[field] && <p className="mt-0.5 text-xs text-red">{errors[field]?.message}</p>}
            </div>
          ))}
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Role</label>
            <select {...register('role')} className="input-field">
              {['admin', 'manager', 'associate', 'user'].map((r) => (
                <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
            <button type="submit" disabled={isPending} className="btn-primary">
              {isPending ? 'Creating…' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const { user: me, can } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch]     = useState('');
  const [showModal, setModal]   = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['users', search],
    queryFn: async () => {
      const q = search ? `?search=${encodeURIComponent(search)}` : '';
      const { data } = await api.get(`/users${q}`);
      return data.data as AuthUser[];
    },
  });

  const { mutate: del, isPending: deleting } = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => { toast.success('User deleted'); qc.invalidateQueries({ queryKey: ['users'] }); setDeleteId(null); },
    onError: () => toast.error('Delete failed'),
  });

  const { mutate: toggle } = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/users/${id}`, { isActive }),
    onSuccess: () => { toast.success('User updated'); qc.invalidateQueries({ queryKey: ['users'] }); },
    onError: () => toast.error('Update failed'),
  });

  if (!can('VIEW_USERS')) {
    return (
      <AppShell title="Users" requireAuth>
        <div className="flex h-64 items-center justify-center">
          <p className="text-sm text-muted">You don&apos;t have permission to view this page.</p>
        </div>
      </AppShell>
    );
  }

  const users = data ?? [];

  return (
    <AppShell title="Users" requireAuth>
      <div className="panel-card">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex items-center gap-2 mr-auto">
            <ShieldCheck size={16} className="text-gold" />
            <h2 className="text-sm font-bold text-text">User Management</h2>
          </div>
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users…"
              className="h-7 w-44 rounded-lg border border-line bg-panel2 pl-7 pr-3 text-xs
                         text-text placeholder:text-muted2 outline-none focus:border-gold transition-all"
            />
          </div>
          {can('MANAGE_USERS') && (
            <button onClick={() => setModal(true)} className="btn-primary text-xs">
              <UserPlus size={12} /> Add User
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-1.5">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-12 rounded" />)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr>
                  {['User', 'Role', 'Status', 'Last Login', 'Created', ''].map((h) => (
                    <th key={h} className="table-th first:rounded-tl-lg last:rounded-tr-lg">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={u._id} className={i % 2 === 0 ? 'bg-bg' : 'bg-panel/40'}>
                    <td className="table-td">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-panel3 text-[11px] font-bold text-muted shrink-0">
                          {u.name[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-text">{u.name}</div>
                          <div className="text-[10px] text-muted">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="table-td">
                      <Badge variant={ROLE_COLOR[u.role]}>{u.role}</Badge>
                    </td>
                    <td className="table-td">
                      <Badge variant={u.isActive ? 'green' : 'gray'}>{u.isActive ? 'Active' : 'Inactive'}</Badge>
                    </td>
                    <td className="table-td text-[10px] text-muted">{u.lastLogin ? fmtDateTime(u.lastLogin) : '—'}</td>
                    <td className="table-td text-[10px] text-muted">{fmtDateTime(u.createdAt)}</td>
                    <td className="table-td">
                      {can('MANAGE_USERS') && u._id !== me?._id && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => toggle({ id: u._id, isActive: !u.isActive })}
                            className={`btn-ghost py-0.5 px-1.5 text-[10px] ${u.isActive ? 'hover:text-red' : 'hover:text-green'}`}
                          >
                            {u.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button onClick={() => setDeleteId(u._id)} className="btn-ghost p-1 hover:text-red hover:border-red/30">
                            <Trash2 size={11} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && <UserModal onClose={() => setModal(false)} />}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete User"
        message="This will permanently deactivate this user. They will not be able to log in."
        loading={deleting}
        onConfirm={() => deleteId && del(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </AppShell>
  );
}
