'use client';
import { useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/features/authentication/components/AuthProvider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import Badge from '@/components/shared/Badge';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import EmptyState from '@/components/shared/EmptyState';
import { Plus, Pencil, Trash2, Search, Truck, X, Check, RotateCcw, Archive } from 'lucide-react';
import toast from 'react-hot-toast';

interface TransporterMapping {
  _id: string;
  originalName: string;
  standardName: string;
  isFix: boolean;
  isActive: boolean;
  needsReview: boolean;
  deletedAt?: string;
  createdAt: string;
}

// ── Add / Edit Modal ──────────────────────────────────────────────────────────
function TransporterModal({
  editing,
  onClose,
}: {
  editing: TransporterMapping | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const isEdit = !!editing;

  const [originalName, setOriginalName] = useState(editing?.originalName ?? '');
  const [standardName, setStandardName] = useState(editing?.standardName ?? '');
  const [isFix, setIsFix]               = useState(editing?.isFix ?? false);

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: { originalName: string; standardName: string; isFix: boolean }) => {
      if (isEdit) {
        return api.patch(`/transporters/${editing._id}`, data);
      }
      return api.post('/transporters', data);
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Mapping updated' : 'Mapping added');
      qc.invalidateQueries({ queryKey: ['transporters'] });
      onClose();
    },
    onError: (e: unknown) => {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message ?? 'Failed to save');
    },
  });

  const handleSubmit = () => {
    if (!originalName.trim()) { toast.error('Original name is required'); return; }
    if (!standardName.trim()) { toast.error('Standard name is required'); return; }
    mutate({ originalName: originalName.trim(), standardName: standardName.trim(), isFix });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md animate-fade-up rounded-2xl border border-line bg-panel p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-sm font-bold text-text">
            {isEdit ? 'Edit Transporter Mapping' : 'Add New Transporter Mapping'}
          </h3>
          <button onClick={onClose} className="text-muted hover:text-text transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Original Name */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted">
              Original Name <span className="text-muted2">(from SAP)</span>
            </label>
            <input
              value={originalName}
              onChange={(e) => setOriginalName(e.target.value.toUpperCase())}
              placeholder="e.g. B R LOGIST"
              className="input-field font-mono"
            />
            <p className="mt-1 text-[10px] text-muted2">Exact name as it appears in your Excel file</p>
          </div>

          {/* Standard Name */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted">
              Standard Name <span className="text-muted2">(clean name)</span>
            </label>
            <input
              value={standardName}
              onChange={(e) => setStandardName(e.target.value.toUpperCase())}
              placeholder="e.g. BR LOGISTICS"
              className="input-field font-mono"
            />
            <p className="mt-1 text-[10px] text-muted2">How it will be stored in database</p>
          </div>

          {/* Fix / Non Fix */}
          <div>
            <label className="mb-2 block text-xs font-semibold text-muted">Load Type</label>
            <div className="flex gap-2">
              <button
                onClick={() => setIsFix(true)}
                className={`flex-1 rounded-lg border py-2.5 text-xs font-semibold transition-all ${
                  isFix
                    ? 'border-blue bg-blue/10 text-blue'
                    : 'border-line bg-panel2 text-muted hover:border-muted2'
                }`}
              >
                {isFix && <Check size={11} className="inline mr-1" />}
                FIX
              </button>
              <button
                onClick={() => setIsFix(false)}
                className={`flex-1 rounded-lg border py-2.5 text-xs font-semibold transition-all ${
                  !isFix
                    ? 'border-gold bg-gold/10 text-gold'
                    : 'border-line bg-panel2 text-muted hover:border-muted2'
                }`}
              >
                {!isFix && <Check size={11} className="inline mr-1" />}
                NON FIX
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-2 justify-end">
          <button onClick={onClose} className="btn-ghost" disabled={isPending}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={isPending} className="btn-primary">
            {isPending
              ? <><span className="h-3 w-3 animate-spin rounded-full border-2 border-black/20 border-t-black" /> Saving…</>
              : isEdit ? 'Save Changes' : 'Add Mapping'
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function TransportersPage() {
  const { can } = useAuth();
  const qc = useQueryClient();

  const [search, setSearch]       = useState('');
  const [fixFilter, setFixFilter] = useState('');
  const [reviewOnly, setReviewOnly] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const [page, setPage]         = useState(1);
  const [showModal, setModal]   = useState(false);
  const [editing, setEditing]   = useState<TransporterMapping | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Fetch transporters
  const { data, isLoading } = useQuery({
    queryKey: ['transporters', search, fixFilter, reviewOnly, showDeleted, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search)      params.append('search', search);
      if (fixFilter)   params.append('isFix', fixFilter);
      if (reviewOnly)  params.append('needsReview', 'true');
      if (showDeleted) params.append('deletedOnly', 'true');
      params.append('page', String(page));
      params.append('limit', '20');
      const { data } = await api.get(`/transporters?${params}`);
      return data;
    },
  });

  // Count of items needing review (for the badge) — separate lightweight query
  const { data: reviewData } = useQuery({
    queryKey: ['transporters', 'review-count'],
    queryFn: async () => {
      const { data } = await api.get('/transporters?needsReview=true&limit=1');
      return data;
    },
    refetchInterval: 30_000, // refresh every 30s in case new uploads happen
  });
  const reviewCount: number = reviewData?.pagination?.total ?? 0;

  const transporters: TransporterMapping[] = data?.data ?? [];
  const total: number = data?.pagination?.total ?? 0;
  const totalPages: number = data?.pagination?.totalPages ?? 1;

  // Delete mutation
  const { mutate: del, isPending: deleting } = useMutation({
    mutationFn: (id: string) => api.delete(`/transporters/${id}`),
    onSuccess: () => {
      toast.success('Mapping deleted');
      qc.invalidateQueries({ queryKey: ['transporters'] });
      setDeleteId(null);
    },
    onError: () => toast.error('Delete failed'),
  });

  // Restore mutation
  const { mutate: restore, isPending: restoring } = useMutation({
    mutationFn: (id: string) => api.put(`/transporters/${id}`),
    onSuccess: () => {
      toast.success('Mapping restored');
      qc.invalidateQueries({ queryKey: ['transporters'] });
    },
    onError: (e: unknown) => {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message ?? 'Restore failed');
    },
  });

  // Permission check
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
        {/* Header */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 mr-auto">
            <Truck size={16} className="text-gold" />
            <h2 className="text-sm font-bold text-text">Transporter Mappings</h2>
            <span className="badge bg-panel3 text-muted2 ring-1 ring-line">{total} total</span>
            {reviewCount > 0 && (
              <button
                onClick={() => { setReviewOnly((v) => !v); setPage(1); }}
                className={`badge cursor-pointer transition-all ${
                  reviewOnly
                    ? 'bg-red text-white ring-1 ring-red'
                    : 'bg-red/10 text-red ring-1 ring-red/30 hover:bg-red/20'
                }`}
                title="Transporters found during upload that need a proper mapping"
              >
                ⚠ {reviewCount} need review
              </button>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted2 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search name…"
              className="h-7 w-44 rounded-lg border border-line bg-panel2 pl-7 pr-3 text-xs
                         text-text placeholder:text-muted2 outline-none focus:border-gold transition-all"
            />
          </div>

          {/* Fix filter */}
          {!showDeleted && (
            <div className="flex items-center gap-1 rounded-lg border border-line bg-panel2 p-0.5">
              {[
                { label: 'All',     value: '' },
                { label: 'FIX',     value: 'true' },
                { label: 'NON FIX', value: 'false' },
              ].map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => { setFixFilter(value); setPage(1); }}
                  className={`rounded-md px-2.5 py-1 text-[10px] font-semibold transition-all ${
                    fixFilter === value ? 'bg-gold text-black' : 'text-muted hover:text-text'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Show Deleted toggle */}
          <button
            onClick={() => { setShowDeleted((v) => !v); setReviewOnly(false); setPage(1); }}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold transition-all ${
              showDeleted
                ? 'border-purple/30 bg-purple/10 text-purple'
                : 'border-line bg-panel2 text-muted hover:text-text hover:border-muted2'
            }`}
          >
            <Archive size={11} />
            {showDeleted ? 'Viewing Deleted' : 'Show Deleted'}
          </button>

          {/* Add button */}
          {!showDeleted && (
            <button onClick={() => { setEditing(null); setModal(true); }} className="btn-primary text-xs">
              <Plus size={12} /> Add Mapping
            </button>
          )}
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="space-y-1.5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton h-10 rounded" />
            ))}
          </div>
        ) : transporters.length === 0 ? (
          <EmptyState
            icon={showDeleted ? Archive : Truck}
            title={showDeleted ? 'No deleted mappings' : 'No mappings found'}
            message={showDeleted
              ? 'Nothing has been deleted yet.'
              : 'Add your first transporter mapping using the button above.'}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    {['#', 'Original Name (SAP)', 'Standard Name', 'Type', 'Actions'].map((h) => (
                      <th key={h} className="table-th first:rounded-tl-lg last:rounded-tr-lg">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transporters.map((t, i) => (
                    <tr
                      key={t._id}
                      className={`transition-colors hover:bg-panel2 ${
                        t.needsReview ? 'bg-red/5 ring-1 ring-red/10' : i % 2 === 0 ? 'bg-bg' : 'bg-panel/40'
                      }`}
                    >
                      {/* Row number */}
                      <td className="table-td text-[10px] text-muted2 font-mono w-8">
                        {(page - 1) * 20 + i + 1}
                      </td>

                      {/* Original name */}
                      <td className="table-td">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs text-gold bg-gold/5 px-2 py-0.5 rounded border border-gold/10">
                            {t.originalName}
                          </span>
                          {t.needsReview && (
                            <span title="Auto-added from upload — needs your review" className="text-red text-xs">⚠</span>
                          )}
                        </div>
                      </td>

                      {/* Standard name */}
                      <td className="table-td">
                        {t.needsReview ? (
                          <span className="text-xs text-muted2 italic">Not set yet — click edit</span>
                        ) : (
                          <span className="text-xs font-semibold text-text">{t.standardName}</span>
                        )}
                      </td>

                      {/* Fix / Non Fix */}
                      <td className="table-td">
                        <Badge variant={t.isFix ? 'blue' : 'gold'}>
                          {t.isFix ? 'FIX' : 'NON FIX'}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="table-td">
                        <div className="flex items-center gap-1">
                          {showDeleted ? (
                            <button
                              onClick={() => restore(t._id)}
                              disabled={restoring}
                              className="btn-ghost flex items-center gap-1 px-2 py-1 text-[10px] hover:text-green hover:border-green/30"
                              title="Restore this mapping"
                            >
                              <RotateCcw size={11} /> Restore
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => { setEditing(t); setModal(true); }}
                                className="btn-ghost p-1.5 hover:text-gold hover:border-gold/30"
                                title="Edit"
                              >
                                <Pencil size={11} />
                              </button>
                              <button
                                onClick={() => setDeleteId(t._id)}
                                className="btn-ghost p-1.5 hover:text-red hover:border-red/30"
                                title="Delete"
                              >
                                <Trash2 size={11} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                <span className="text-[10px] text-muted">{total} total mappings</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => p - 1)}
                    disabled={page <= 1}
                    className="btn-ghost px-2 py-1 text-xs disabled:opacity-30"
                  >
                    ← Prev
                  </button>
                  <span className="px-2 text-xs text-muted font-mono">{page}/{totalPages}</span>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= totalPages}
                    className="btn-ghost px-2 py-1 text-xs disabled:opacity-30"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <TransporterModal
          editing={editing}
          onClose={() => { setModal(false); setEditing(null); }}
        />
      )}

      {/* Delete confirm */}
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