'use client';
import AppShell from '@/components/layout/AppShell';
import { useAlerts } from '@/features/dashboard/hooks/useDashboard';
import { useFilters } from '@/features/dashboard/components/FilterProvider';
import { useAlertsInsights } from '@/features/alerts/hooks/useAlertsInsights';
import AlertsSummaryStrip from '@/features/alerts/components/AlertsSummaryStrip';
import AlertsInsightPanels from '@/features/alerts/components/AlertsInsightPanels';
import AlertsFilterBar from '@/features/alerts/components/AlertsFilterBar';
import AlertsTable from '@/features/alerts/components/AlertsTable';
import { AlertTriangle } from 'lucide-react';

export default function AlertsPage() {
  const { filters } = useFilters();
  const { data = [], isLoading } = useAlerts(filters);

  const {
    divisions, transporters,
    divisionFilter, setDivisionFilter,
    transporterFilter, setTransporterFilter,
    loadTypeFilter, setLoadTypeFilter,
    sortDir, setSortDir,
    sortedRows, summary, insights,
  } = useAlertsInsights(data);

  return (
    <AppShell title="Alerts">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red/10 ring-1 ring-red/20">
          <AlertTriangle size={18} className="text-red" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-text">Company Detention Cases</h2>
          <p className="text-[10px] text-muted">WLL Weightment IN→OUT exceeding 25 hours — internal cause, not a transporter fault</p>
        </div>
      </div>

      <AlertsSummaryStrip summary={summary} loading={isLoading} />

      <AlertsInsightPanels insights={insights} loading={isLoading} />

      <div className="panel-card">
        <AlertsFilterBar
          divisions={divisions}
          transporters={transporters}
          divisionFilter={divisionFilter}
          onDivisionChange={setDivisionFilter}
          transporterFilter={transporterFilter}
          onTransporterChange={setTransporterFilter}
          loadTypeFilter={loadTypeFilter}
          onLoadTypeChange={setLoadTypeFilter}
          sortDir={sortDir}
          onToggleSort={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')}
          resultCount={sortedRows.length}
          loading={isLoading}
        />
        <AlertsTable rows={sortedRows} loading={isLoading} />
      </div>
    </AppShell>
  );
}