import { memo } from 'react';
import KpiCard from '@/components/shared/KpiCard';
import { fmtHours, fmtNum } from '@/lib/utils';
import type { AlertsSummary } from '../types';

interface Props {
  summary: AlertsSummary;
  loading?: boolean;
}

function AlertsSummaryStrip({ summary, loading }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
      <KpiCard label="Total Detained (>25h)" value={summary.total} color="red" loading={loading} formatter={fmtNum} decimals={0} />
      <KpiCard label="Avg Detention" value={summary.avg} color="gold" loading={loading} formatter={fmtHours} decimals={1} />
      <KpiCard label="Max Detention" value={summary.max} color="red" loading={loading} formatter={fmtHours} decimals={1} />
      <KpiCard label="Total Hours Lost" value={summary.totalHours} color="purple" loading={loading} formatter={fmtHours} decimals={1} />
    </div>
  );
}

export default memo(AlertsSummaryStrip);