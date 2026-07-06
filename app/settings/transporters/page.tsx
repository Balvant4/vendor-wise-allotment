'use client';
import { useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { useAuth } from '@/features/authentication/components/AuthProvider';
import TransporterModal from '@/features/transporters/components/TransporterModal';
import TransportersToolbar from '@/features/transporters/components/TransportersToolbar';
import TransportersTable from '@/features/transporters/components/TransportersTable';
import {
  useDeleteTransporter,
  useRestoreTransporter,
  useTransportersList,
  useTransportersReviewCount,
} from '@/features/transporters/hooks/useTransporters';
import type { TransporterMapping } from '@/features/transporters/types';

export default function TransportersPage() {
  const { can } = useAuth();

  const [search, setSearch] = useState('');
  const [fixFilter, setFixFilter] = useState('');
  const [reviewOnly, setReviewOnly] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const [page, setPage] = useState(1);
  const [showModal, setModal] = useState(false);
  const [editing, setEditing] = useState<TransporterMapping | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useTransportersList({ search, fixFilter, reviewOnly, showDeleted, page });
  const reviewCount = useTransportersReviewCount();

  const transporters: TransporterMapping[] = data?.data ?? [];
  const total = data?.pagination?.total ?? 0;
  const totalPages = data?.pagination?.totalPages ?? 1;

  const { mutate: del, isPending: deleting } = useDeleteTransporter(() => setDeleteId(null));
  const { mutate: restore, isPending: restoring } = useRestoreTransporter();

  if (!can('VIEW_USERS')) {
    return (
      <AppShell title="Transporter Master" requireAuth>
        <div className="flex h-64 items-center justify-center">
          <p className="text-sm text-muted">Only admin and manager can access this page.</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Transporter Master" requireAuth>
      <div className="panel-card">
        <TransportersToolbar
          total={total}
          reviewCount={reviewCount}
          search={search}
          fixFilter={fixFilter}
          reviewOnly={reviewOnly}
          showDeleted={showDeleted}
          onSearchChange={(value) => { setSearch(value); setPage(1); }}
          onFixFilterChange={(value) => { setFixFilter(value); setPage(1); }}
          onToggleReviewOnly={() => { setReviewOnly((v) => !v); setPage(1); }}
          onToggleShowDeleted={() => { setShowDeleted((v) => !v); setReviewOnly(false); setPage(1); }}
          onAddClick={() => { setEditing(null); setModal(true); }}
        />

        <TransportersTable
          transporters={transporters}
          isLoading={isLoading}
          showDeleted={showDeleted}
          page={page}
          total={total}
          totalPages={totalPages}
          restoring={restoring}
          onEdit={(t) => { setEditing(t); setModal(true); }}
          onDeleteRequest={setDeleteId}
          onRestore={restore}
          onPageChange={setPage}
        />
      </div>

      {showModal && (
        <TransporterModal editing={editing} onClose={() => { setModal(false); setEditing(null); }} />
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Mapping"
        message="This will remove this transporter mapping. Future uploads will treat this transporter as unmapped."
        loading={deleting}
        onConfirm={() => deleteId && del(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </AppShell>
  );
}
