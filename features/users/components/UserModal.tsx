'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createUserSchema } from '@/server/validations/auth.validation';
import { useCreateUser } from '../hooks/useUsers';
import type { CreateUserForm } from '../types';

const ROLES = ['admin', 'manager', 'associate', 'user'] as const;
const TEXT_FIELDS = ['name', 'email', 'password'] as const;

export default function UserModal({ onClose }: { onClose: () => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { role: 'user' },
  });

  const { mutate, isPending } = useCreateUser(onClose);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md animate-fade-up rounded-2xl border border-line bg-panel p-6 shadow-2xl">
        <h3 className="mb-4 text-sm font-bold text-text">Create New User</h3>
        <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-3">
          {TEXT_FIELDS.map((field) => (
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
              {ROLES.map((r) => (
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
