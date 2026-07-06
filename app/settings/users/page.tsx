'use client';
import { useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { useAuth } from '@/features/authentication/components/AuthProvider';
import UserModal from '@/features/users/components/UserModal';
import UsersToolbar from '@/features/users/components/UsersToolbar';
import UsersTable from '@/features/users/components/UsersTable';
import { useDeleteUser, useToggleUserActive, useUsersList } from '@/features/users/hooks/useUsers';

export default function UsersPage() {
  const { user: me, can } = useAuth();
  const [search, setSearch] = useState('');
  const [showModal, setModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useUsersList(search);
  const { mutate: del, isPending: deleting } = useDeleteUser(() => setDeleteId(null));
  const { mutate: toggle } = useToggleUserActive();

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
        <UsersToolbar
          search={search}
          canManage={can('MANAGE_USERS')}
          onSearchChange={setSearch}
          onAddClick={() => setModal(true)}
        />

        <UsersTable
          users={users}
          isLoading={isLoading}
          currentUserId={me?._id}
          canManage={can('MANAGE_USERS')}
          onToggleActive={(id, isActive) => toggle({ id, isActive })}
          onDeleteRequest={setDeleteId}
        />
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
