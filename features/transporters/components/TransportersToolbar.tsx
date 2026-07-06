'use client';
import { Archive, Plus, Search, Truck } from 'lucide-react';

interface TransportersToolbarProps {
  total: number;
  reviewCount: number;
  search: string;
  fixFilter: string;
  reviewOnly: boolean;
  showDeleted: boolean;
  onSearchChange: (value: string) => void;
  onFixFilterChange: (value: string) => void;
  onToggleReviewOnly: () => void;
  onToggleShowDeleted: () => void;
  onAddClick: () => void;
}

const FIX_FILTER_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'FIX', value: 'true' },
  { label: 'NON FIX', value: 'false' },
] as const;

export default function TransportersToolbar({
  total,
  reviewCount,
  search,
  fixFilter,
  reviewOnly,
  showDeleted,
  onSearchChange,
  onFixFilterChange,
  onToggleReviewOnly,
  onToggleShowDeleted,
  onAddClick,
}: TransportersToolbarProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 mr-auto">
        <Truck size={16} className="text-gold" />
        <h2 className="text-sm font-bold text-text">Transporter Mappings</h2>
        <span className="badge bg-panel3 text-muted2 ring-1 ring-line">{total} total</span>
        {reviewCount > 0 && (
          <button
            onClick={onToggleReviewOnly}
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

      <div className="relative">
        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted2 pointer-events-none" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search name…"
          className="h-7 w-44 rounded-lg border border-line bg-panel2 pl-7 pr-3 text-xs
                     text-text placeholder:text-muted2 outline-none focus:border-gold transition-all"
        />
      </div>

      {!showDeleted && (
        <div className="flex items-center gap-1 rounded-lg border border-line bg-panel2 p-0.5">
          {FIX_FILTER_OPTIONS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => onFixFilterChange(value)}
              className={`rounded-md px-2.5 py-1 text-[10px] font-semibold transition-all ${
                fixFilter === value ? 'bg-gold text-black' : 'text-muted hover:text-text'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <button
        onClick={onToggleShowDeleted}
        className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold transition-all ${
          showDeleted
            ? 'border-purple/30 bg-purple/10 text-purple'
            : 'border-line bg-panel2 text-muted hover:text-text hover:border-muted2'
        }`}
      >
        <Archive size={11} />
        {showDeleted ? 'Viewing Deleted' : 'Show Deleted'}
      </button>

      {!showDeleted && (
        <button onClick={onAddClick} className="btn-primary text-xs">
          <Plus size={12} /> Add Mapping
        </button>
      )}
    </div>
  );
}
