import { memo, useMemo } from 'react';
import { Users, Building2, MessageSquareWarning } from 'lucide-react';
import BreakdownBarList, { type BreakdownItem } from './BreakdownBarList';
import SeverityBreakdownPanel from './SeverityBreakdownPanel';
import WeekdayPatternPanel from './WeekdayPatternPanel';
import RepeatVehiclesPanel from './RepeatVehiclesPanel';
import { fmtHours, fmtNum } from '@/lib/utils';
import type { AlertsInsights } from '../types';

interface Props {
  insights: AlertsInsights;
  loading?: boolean;
}

function toBarItems(entries: [string, { count: number; hours: number }][]): BreakdownItem[] {
  return entries.map(([label, v]) => ({
    key: label,
    label,
    value: v.count,
    sublabel: `${fmtNum(v.count)} · ${fmtHours(v.hours)}`,
  }));
}

function AlertsInsightPanels({ insights, loading }: Props) {
  const transporterItems = useMemo(() => toBarItems(insights.byTransporter), [insights.byTransporter]);
  const warehouseItems = useMemo(() => toBarItems(insights.byWarehouse), [insights.byWarehouse]);
  const reasonItems = useMemo<BreakdownItem[]>(
    () => insights.reasons.map(([label, count]) => ({ key: label, label, value: count })),
    [insights.reasons]
  );

  return (
    <>
      {/* Who + where + why */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3">
        <BreakdownBarList
          icon={Users}
          iconColorClass="text-gold"
          barColorClass="bg-gold"
          title="By Transporter"
          items={transporterItems}
          loading={loading}
        />
        <BreakdownBarList
          icon={Building2}
          iconColorClass="text-blue"
          barColorClass="bg-blue"
          title="By Warehouse"
          items={warehouseItems}
          loading={loading}
        />
        <BreakdownBarList
          icon={MessageSquareWarning}
          iconColorClass="text-purple"
          barColorClass="bg-purple"
          title="Detention Reasons"
          items={reasonItems}
          loading={loading}
        />
      </div>

      {/* Severity + timing patterns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">
        <SeverityBreakdownPanel severityCounts={insights.severityCounts} loading={loading} />
        <WeekdayPatternPanel weekdayCounts={insights.weekdayCounts} loading={loading} />
        <RepeatVehiclesPanel repeatVehicles={insights.repeatVehicles} loading={loading} />
      </div>
    </>
  );
}

export default memo(AlertsInsightPanels);