'use client';
import { useState, useCallback, useRef } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useUploads, useUploadFile, useDeleteUpload } from '@/features/uploads/hooks/useUploads';
import { useAuth } from '@/features/authentication/components/AuthProvider';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import Badge from '@/components/shared/Badge';
import { fmtDateTime, fmtNum } from '@/lib/utils';
import { Upload, FileSpreadsheet, Trash2, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import type { UploadRecord, UploadStatus } from '@/types';

const STATUS_META: Record<UploadStatus, { label: string; color: 'green' | 'red' | 'gold' | 'gray'; icon: typeof CheckCircle }> = {
  completed:  { label: 'Completed',  color: 'green', icon: CheckCircle },
  failed:     { label: 'Failed',     color: 'red',   icon: XCircle },
  processing: { label: 'Processing', color: 'gold',  icon: RefreshCw },
  pending:    { label: 'Pending',    color: 'gray',  icon: Clock },
};

function UploadRow({ upload, canDelete, onDelete }: {
  upload: UploadRecord;
  canDelete: boolean;
  onDelete: (id: string) => void;
}) {
  const sm = STATUS_META[upload.status];
  const Icon = sm.icon;

  return (
    <tr className="hover:bg-panel2 transition-colors">
      <td className="table-td">
        <div className="flex items-center gap-2">
          <FileSpreadsheet size={14} className="text-green shrink-0" />
          <span className="text-xs text-text font-medium truncate max-w-[200px]">{upload.originalName}</span>
        </div>
      </td>
      <td className="table-td">
        <Badge variant={sm.color} className="inline-flex items-center gap-1">
          <Icon size={10} className={upload.status === 'processing' ? 'animate-spin' : ''} />
          {sm.label}
        </Badge>
      </td>
      <td className="table-td font-mono text-xs text-gold">{fmtNum(upload.totalRows)}</td>
      <td className="table-td font-mono text-xs text-green">{fmtNum(upload.validRows)}</td>
      <td className="table-td font-mono text-xs text-red">{fmtNum(upload.duplicateRows)}</td>
      <td className="table-td font-mono text-xs text-muted">{fmtNum(upload.errorRows)}</td>
      <td className="table-td text-[10px] text-muted">{fmtDateTime(upload.createdAt)}</td>
      <td className="table-td">
        {canDelete && (
          <button onClick={() => onDelete(upload._id)} className="btn-ghost p-1 hover:text-red hover:border-red/30">
            <Trash2 size={12} />
          </button>
        )}
      </td>
    </tr>
  );
}

export default function UploadPage() {
  const { can } = useAuth();
  const [page]               = useState(1);
  const { data, isLoading }  = useUploads(page);
  const { mutate: upload, isPending } = useUploadFile();
  const { mutate: del, isPending: deleting } = useDeleteUpload();

  const uploads: UploadRecord[] = data?.data ?? [];

  // Drag & drop
  const [dragging, setDragging] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files?.length) return;
    const file = files[0];
    upload({ file });
  }, [upload]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <AppShell title="Upload" requireAuth>
      <div className="max-w-4xl space-y-4">
        {/* Dropzone */}
        <div className="panel-card">
          <h2 className="text-sm font-bold text-text mb-4">Upload Excel / CSV</h2>

          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`relative flex flex-col items-center justify-center gap-3 rounded-2xl
                        border-2 border-dashed py-12 cursor-pointer transition-all
                        ${dragging
                          ? 'border-gold bg-gold/10'
                          : 'border-line bg-panel2 hover:border-gold/50 hover:bg-panel3'
                        }
                        ${isPending ? 'pointer-events-none opacity-60' : ''}`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-all
                             ${dragging ? 'bg-gold/20 ring-gold/40' : 'bg-panel3 ring-line'} ring-1`}>
              {isPending
                ? <div className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-gold" />
                : <Upload size={24} className={dragging ? 'text-gold' : 'text-muted2'} />
              }
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-text">
                {isPending ? 'Processing file…' : dragging ? 'Drop to upload' : 'Drop file here or click to browse'}
              </p>
              <p className="text-xs text-muted mt-1">Supports .xlsx, .xls, .csv — max {process.env.NEXT_PUBLIC_MAX_MB ?? 50}MB</p>
            </div>
          </div>

          {/* Fix / Non-Fix mapping info */}
          <div className="mt-4 rounded-lg border border-line bg-panel2 p-3">
            <p className="text-xs text-muted">
              Fix / Non-Fix and transporter name cleanup are driven by the{' '}
              <a href="/settings/transporters" className="text-gold hover:underline">
                Transporter Master
              </a>{' '}
              table. Any transporter not yet mapped will be auto-added there for review after upload.
            </p>
          </div>
        </div>

        {/* Upload history */}
        <div className="panel-card">
          <h3 className="text-xs font-bold text-text mb-4">Upload History</h3>

          {isLoading ? (
            <div className="space-y-1.5">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-10 rounded" />)}
            </div>
          ) : !uploads.length ? (
            <div className="flex flex-col items-center py-10 gap-2">
              <FileSpreadsheet size={28} className="text-muted2" />
              <p className="text-xs text-muted">No uploads yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr>
                    {['File', 'Status', 'Total', 'Inserted', 'Duplicates', 'Errors', 'Uploaded', ''].map((h) => (
                      <th key={h} className="table-th first:rounded-tl-lg last:rounded-tr-lg">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {uploads.map((u) => (
                    <UploadRow
                      key={u._id}
                      upload={u}
                      canDelete={can('DELETE_UPLOADS')}
                      onDelete={(id) => setDeleteId(id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Upload"
        message="This will permanently delete this upload and all its vehicle records. This action cannot be undone."
        loading={deleting}
        onConfirm={() => { if (deleteId) del(deleteId); setDeleteId(null); }}
        onCancel={() => setDeleteId(null)}
      />
    </AppShell>
  );
}
