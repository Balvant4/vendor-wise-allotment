'use client';
import { useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/features/authentication/components/AuthProvider';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/axios';
import { fmtDateTime } from '@/lib/utils';
import Badge from '@/components/shared/Badge';
import { Lock, User, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import type { UserRole } from '@/types';

const ROLE_COLOR: Record<UserRole, 'red' | 'gold' | 'blue' | 'gray'> = {
  admin: 'red', manager: 'gold', associate: 'blue', user: 'gray',
};

export default function SettingsPage() {
  const { user } = useAuth();
  const [oldPw, setOldPw]   = useState('');
  const [newPw, setNewPw]   = useState('');
  const [confPw, setConfPw] = useState('');

  const { mutate: changePw, isPending } = useMutation({
    mutationFn: (body: { currentPassword: string; newPassword: string }) =>
      api.patch('/auth?action=change-password', body),
    onSuccess: () => {
      toast.success('Password changed successfully');
      setOldPw(''); setNewPw(''); setConfPw('');
    },
    onError: (e: unknown) => {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message ?? 'Failed to change password');
    },
  });

  const handleChangePw = () => {
    if (newPw !== confPw) { toast.error('New passwords do not match'); return; }
    if (newPw.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    changePw({ currentPassword: oldPw, newPassword: newPw });
  };

  return (
    <AppShell title="Settings" requireAuth>
      <div className="max-w-2xl space-y-4">
        {/* Profile */}
        <div className="panel-card">
          <div className="mb-4 flex items-center gap-2">
            <User size={15} className="text-gold" />
            <h3 className="text-sm font-bold text-text">Profile</h3>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/15 text-xl font-bold text-gold ring-1 ring-gold/30">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <div className="text-sm font-bold text-text">{user?.name}</div>
              <div className="text-xs text-muted">{user?.email}</div>
              <div className="mt-1.5 flex items-center gap-2">
                {user?.role && <Badge variant={ROLE_COLOR[user.role]}>{user.role}</Badge>}
                <Badge variant={user?.isActive ? 'green' : 'gray'}>{user?.isActive ? 'Active' : 'Inactive'}</Badge>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 rounded-xl bg-panel2 p-3 text-xs">
            <div>
              <div className="text-muted2 text-[10px] mb-0.5">Last login</div>
              <div className="text-text">{user?.lastLogin ? fmtDateTime(user.lastLogin) : '—'}</div>
            </div>
            <div>
              <div className="text-muted2 text-[10px] mb-0.5">Member since</div>
              <div className="text-text">{user?.createdAt ? fmtDateTime(user.createdAt) : '—'}</div>
            </div>
          </div>
        </div>

        {/* Change password */}
        <div className="panel-card">
          <div className="mb-4 flex items-center gap-2">
            <Lock size={15} className="text-gold" />
            <h3 className="text-sm font-bold text-text">Change Password</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Current password', value: oldPw,   set: setOldPw },
              { label: 'New password',     value: newPw,   set: setNewPw },
              { label: 'Confirm password', value: confPw,  set: setConfPw },
            ].map(({ label, value, set }) => (
              <div key={label}>
                <label className="block text-xs font-semibold text-muted mb-1">{label}</label>
                <input
                  type="password"
                  value={value}
                  onChange={(e) => set(e.target.value)}
                  className="input-field"
                />
              </div>
            ))}
            <button
              onClick={handleChangePw}
              disabled={isPending || !oldPw || !newPw || !confPw}
              className="btn-primary mt-1"
            >
              {isPending ? 'Updating…' : 'Update Password'}
            </button>
          </div>
        </div>

        {/* Permissions */}
        <div className="panel-card">
          <div className="mb-3 flex items-center gap-2">
            <ShieldCheck size={15} className="text-gold" />
            <h3 className="text-sm font-bold text-text">Your Permissions</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'View Dashboard',    granted: true },
              { label: 'Upload Files',      granted: ['admin','manager','associate'].includes(user?.role ?? '') },
              { label: 'Delete Uploads',    granted: user?.role === 'admin' },
              { label: 'View Users',        granted: ['admin','manager'].includes(user?.role ?? '') },
              { label: 'Manage Users',      granted: user?.role === 'admin' },
              { label: 'Export Data',       granted: ['admin','manager','associate'].includes(user?.role ?? '') },
            ].map(({ label, granted }) => (
              <div key={label} className="flex items-center justify-between rounded-lg bg-panel2 px-3 py-2">
                <span className="text-xs text-muted">{label}</span>
                <Badge variant={granted ? 'green' : 'gray'}>{granted ? 'Yes' : 'No'}</Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
