'use client';
import { useState } from 'react';
import { Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSaveTransporter } from '../hooks/useTransporters';
import type { TransporterMapping } from '../types';

interface TransporterModalProps {
  editing: TransporterMapping | null;
  onClose: () => void;
}

export default function TransporterModal({ editing, onClose }: TransporterModalProps) {
  const isEdit = !!editing;

  const [originalName, setOriginalName] = useState(editing?.originalName ?? '');
  const [standardName, setStandardName] = useState(editing?.standardName ?? '');
  const [isFix, setIsFix] = useState(editing?.isFix ?? false);

  const { mutate, isPending } = useSaveTransporter(editing, onClose);

  const handleSubmit = () => {
    if (!originalName.trim()) { toast.error('Original name is required'); return; }
    if (!standardName.trim()) { toast.error('Standard name is required'); return; }
    mutate({ originalName: originalName.trim(), standardName: standardName.trim(), isFix });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md animate-fade-up rounded-2xl border border-line bg-panel p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-sm font-bold text-text">
            {isEdit ? 'Edit Transporter Mapping' : 'Add New Transporter Mapping'}
          </h3>
          <button onClick={onClose} className="text-muted hover:text-text transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4">
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

        <div className="mt-6 flex gap-2 justify-end">
          <button onClick={onClose} className="btn-ghost" disabled={isPending}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={isPending} className="btn-primary">
            {isPending ? (
              <>
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-black/20 border-t-black" /> Saving…
              </>
            ) : isEdit ? 'Save Changes' : 'Add Mapping'}
          </button>
        </div>
      </div>
    </div>
  );
}
