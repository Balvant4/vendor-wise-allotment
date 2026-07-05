import { memo } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import Badge from '@/components/shared/Badge';

interface Props {
  sortDir: 'asc' | 'desc';
  onToggleSort: () => void;
  resultCount: number;
  loading?: boolean;
}

function AlertsFilterBar({
  sortDir, onToggleSort,
  resultCount, loading,
}: Props) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <button onClick={onToggleSort} className="btn-ghost text-xs ml-auto">
        Duration {sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
      {!loading && <Badge variant="red" className="text-xs px-2 py-1">{resultCount} cases</Badge>}
    </div>
  );
}

export default memo(AlertsFilterBar);