import { memo } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import Badge from '@/components/shared/Badge';
import type { LoadTypeFilter } from '../types';

interface Props {
  divisions: string[];
  transporters: string[];
  divisionFilter: string;
  onDivisionChange: (v: string) => void;
  transporterFilter: string;
  onTransporterChange: (v: string) => void;
  loadTypeFilter: LoadTypeFilter;
  onLoadTypeChange: (v: LoadTypeFilter) => void;
  sortDir: 'asc' | 'desc';
  onToggleSort: () => void;
  resultCount: number;
  loading?: boolean;
}

function AlertsFilterBar({
  divisions, transporters,
  divisionFilter, onDivisionChange,
  transporterFilter, onTransporterChange,
  loadTypeFilter, onLoadTypeChange,
  sortDir, onToggleSort,
  resultCount, loading,
}: Props) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <select value={divisionFilter} onChange={(e) => onDivisionChange(e.target.value)} className="fb-select">
        <option value="">All divisions</option>
        {divisions.map((d) => <option key={d} value={d}>{d}</option>)}
      </select>
      <select value={transporterFilter} onChange={(e) => onTransporterChange(e.target.value)} className="fb-select">
        <option value="">All transporters</option>
        {transporters.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>
      <select
        value={loadTypeFilter}
        onChange={(e) => onLoadTypeChange(e.target.value as LoadTypeFilter)}
        className="fb-select"
      >
        <option value="">Fix + Non-Fix</option>
        <option value="fix">Fix Only</option>
        <option value="nonfix">Non-Fix Only</option>
      </select>
      <button onClick={onToggleSort} className="btn-ghost text-xs ml-auto">
        Duration {sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
      {!loading && <Badge variant="red" className="text-xs px-2 py-1">{resultCount} cases</Badge>}
    </div>
  );
}

export default memo(AlertsFilterBar);