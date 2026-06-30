'use client';
import AppShell from '@/components/layout/AppShell';
import { useAlerts } from '@/features/dashboard/hooks/useDashboard';
import { useFilters } from '@/features/dashboard/components/FilterProvider';
import { fmtDate, fmtHours } from '@/lib/utils';
import Badge from '@/components/shared/Badge';
import EmptyState from '@/components/shared/EmptyState';
import { AlertTriangle, Clock, Truck } from 'lucide-react';

export default function AlertsPage() {
  const { filters } = useFilters();
  const { data = [], isLoading } = useAlerts(filters);

  return (
    <AppShell title="Alerts">
      <div className="panel-card">
        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red/10 ring-1 ring-red/20">
            <AlertTriangle size={18} className="text-red" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-text">Violation Alerts</h2>
            <p className="text-[10px] text-muted">Loads exceeding 25-hour threshold</p>
          </div>
          {!isLoading && (
            <Badge variant="red" className="ml-auto text-xs px-2 py-1">
              {data.length} violations
            </Badge>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-16 rounded-xl" />
            ))}
          </div>
        ) : data.length === 0 ? (
          <EmptyState
            icon={AlertTriangle}
            title="No violations found"
            message="All loads are within the 25-hour threshold for the selected filters."
          />
        ) : (
          <div className="space-y-2">
            {data.map((record) => (
              <div
                key={record._id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-red/15
                           bg-red/5 px-4 py-3 transition-all hover:bg-red/10 animate-fade-up"
              >
                {/* Vehicle & container */}
                <div className="flex items-center gap-2 min-w-[140px]">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red/15 ring-1 ring-red/20 shrink-0">
                    <Truck size={14} className="text-red" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-text font-mono">{record.vehicleNo}</div>
                    <div className="text-[10px] text-muted">{record.containerNo}</div>
                  </div>
                </div>

                {/* Duration — big highlight */}
                <div className="flex items-center gap-1.5 rounded-lg bg-red/10 px-3 py-1.5 ring-1 ring-red/20">
                  <Clock size={12} className="text-red" />
                  <span className="text-sm font-bold text-red font-mono">
                    {fmtHours(record.diffHours)}
                  </span>
                </div>

                {/* Meta chips */}
                <div className="flex flex-wrap gap-1.5 flex-1">
                  <Badge variant="gray">{record.transporter}</Badge>
                  <Badge variant="gray">{record.division}</Badge>
                  <Badge variant={record.isFix ? 'blue' : 'gray'}>
                    {record.isFix ? 'Fix' : 'Non-Fix'}
                  </Badge>
                </div>

                {/* Date */}
                <div className="text-[10px] text-muted ml-auto whitespace-nowrap">
                  {fmtDate(record.reportingDate)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
