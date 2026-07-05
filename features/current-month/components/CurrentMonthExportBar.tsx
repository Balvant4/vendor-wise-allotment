'use client';
import { useState } from 'react';
import { FileSpreadsheet, FileText, Sheet } from 'lucide-react';
import api from '@/lib/axios';
import { downloadBlob, buildQuery } from '@/lib/utils';
import { exportTableToPDF } from '@/lib/pdf-export';
import toast from 'react-hot-toast';
import type { VehicleRecord } from '@/types';

interface Props {
  /** Current query filters (date range + any active table filters) — export requests reuse these exactly. */
  filters: Record<string, unknown>;
  /** Rows currently loaded in the table — used for the PDF's record table (capped client-side view, not the full filtered set). */
  rows: VehicleRecord[];
  kpis?: Record<string, string | number>;
}

type Busy = '' | 'xlsx' | 'csv' | 'pdf';

export default function CurrentMonthExportBar({ filters, rows, kpis }: Props) {
  const [busy, setBusy] = useState<Busy>('');

  const exportFile = async (format: 'xlsx' | 'csv') => {
    setBusy(format);
    try {
      const query = buildQuery({ ...filters, export: format });
      const response = await api.get(`/vehicles${query}`, { responseType: 'blob' });
      downloadBlob(response.data, `current-month_${Date.now()}.${format}`);
      toast.success(`${format.toUpperCase()} export downloaded — matches current filters`);
    } catch {
      toast.error('Export failed');
    } finally {
      setBusy('');
    }
  };

  const exportPdf = async () => {
    setBusy('pdf');
    try {
      await exportTableToPDF({ title: 'Current Month Report', kpis, rows });
      toast.success('PDF downloaded');
    } catch {
      toast.error('PDF export failed — is jspdf installed? (npm install jspdf jspdf-autotable)');
    } finally {
      setBusy('');
    }
  };

  const ExportButton = ({
    id, label, icon: Icon, onClick,
  }: { id: Busy; label: string; icon: typeof FileSpreadsheet; onClick: () => void }) => (
    <button onClick={onClick} disabled={busy !== ''} className="btn-ghost text-xs">
      {busy === id
        ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-muted2/20 border-t-muted2" />
        : <Icon size={12} />
      }
      {label}
    </button>
  );

  return (
    <div className="flex items-center gap-1.5">
      <ExportButton id="xlsx" label="Excel" icon={FileSpreadsheet} onClick={() => exportFile('xlsx')} />
      <ExportButton id="csv"  label="CSV"   icon={Sheet}           onClick={() => exportFile('csv')} />
      <ExportButton id="pdf"  label="PDF"   icon={FileText}        onClick={exportPdf} />
    </div>
  );
}