'use client';
import AppShell from '@/components/layout/AppShell';
import KpiCard from '@/components/shared/KpiCard';
import { useDashboardOverview } from '@/features/dashboard/hooks/useDashboard';
import { useUploads } from '@/features/uploads/hooks/useUploads';
import { useFilters } from '@/features/dashboard/components/FilterProvider';
import { fmtHours, fmtNum, fmtDateTime, pct } from '@/lib/utils';
import {
  Truck, Package, AlertTriangle, Wrench,
  BarChart2, Clock, Activity, TrendingUp, Upload as UploadIcon,
  Users2, FileSpreadsheet, CheckCircle2, XCircle, Loader2,
} from 'lucide-react';
import Link from 'next/link';
import MonthlyBarChart from '@/components/charts/MonthlyBarChart';
import DailyLineChart from '@/components/charts/DailyLineChart';
import DivisionDonutChart from '@/components/charts/DivisionDonutChart';
import HeatmapGrid from '@/components/charts/HeatmapGrid';
import TopTransportersChart from '@/components/charts/TopTransportersChart';
import type { TransporterStats, UploadStatus } from '@/types';

function TransporterTable({ data = [], loading }: { data: TransporterStats[]; loading: boolean }) {
  if (loading) return <div className="skeleton h-40 rounded-lg" />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px]">
        <thead>
          <tr>
            {['Transporter', 'Total', 'Fix', '>25H', 'Avg Hrs', 'Violation%'].map((h) => (
              <th key={h} className="table-th first:rounded-tl-lg last:rounded-tr-lg">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 10).map((row, i) => (
            <tr key={row.transporter} className={i % 2 === 0 ? 'bg-bg' : 'bg-panel/40'}>
              <td className="table-td text-xs font-semibold text-text">{row.transporter}</td>
              <td className="table-td text-xs font-mono text-gold">{fmtNum(row.total)}</td>
              <td className="table-td text-xs font-mono text-blue">{fmtNum(row.fix)}</td>
              <td className="table-td text-xs font-mono text-red">{fmtNum(row.over25)}</td>
              <td className="table-td text-xs font-mono text-muted">{fmtHours(row.avgHours)}</td>
              <td className="table-td">
                <span className={`font-mono text-xs font-semibold ${
                  row.violationRate > 20 ? 'text-red' : row.violationRate > 10 ? 'text-gold' : 'text-green'
                }`}>
                  {pct(row.violationRate)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const UPLOAD_STATUS_ICON: Record<UploadStatus, { icon: typeof CheckCircle2; cls: string }> = {
  completed:  { icon: CheckCircle2, cls: 'text-green' },
  processing: { icon: Loader2,      cls: 'text-blue animate-spin' },
  pending:    { icon: Loader2,      cls: 'text-muted' },
  failed:     { icon: XCircle,      cls: 'text-red' },
};

function RecentActivityFeed() {
  const { data, isLoading } = useUploads(1);
  const uploads = (data?.data ?? []).slice(0, 5);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-12 rounded-lg" />)}
      </div>
    );
  }

  if (!uploads.length) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
        <FileSpreadsheet size={22} className="text-muted2" />
        <p className="text-[11px] text-muted">No uploads yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {uploads.map((u: { _id: string; originalName: string; status: UploadStatus; validRows: number; totalRows: number; createdAt: string }) => {
        const meta = UPLOAD_STATUS_ICON[u.status] ?? UPLOAD_STATUS_ICON.pending;
        const StatusIcon = meta.icon;
        return (
          <div key={u._id} className="flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-panel2 transition-colors">
            <StatusIcon size={14} className={`shrink-0 ${meta.cls}`} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[11px] font-medium text-text">{u.originalName}</div>
              <div className="text-[9px] text-muted2">{fmtDateTime(u.createdAt)}</div>
            </div>
            <span className="shrink-0 text-[9px] font-mono text-muted">{fmtNum(u.validRows)}/{fmtNum(u.totalRows)}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function DashboardPage() {
  const { filters } = useFilters();
  const { data, isLoading } = useDashboardOverview(filters);

  const monthly       = data?.monthly       ?? [];
  const daily         = data?.daily         ?? [];
  const byDivision    = data?.byDivision    ?? [];
  const byTransporter = data?.byTransporter ?? [];
  const byDayOfWeek   = data?.byDayOfWeek   ?? [];

  return (
    <AppShell title="Dashboard">
      {/* Branding banner */}
      <div className="mb-5 rounded-2xl border border-gold/20 bg-gradient-to-r from-gold/10 via-panel to-panel px-4 sm:px-5 py-4">
        <h1 className="text-base sm:text-lg font-bold text-text">Welspun Living — Export Control Tower</h1>
        <p className="text-[11px] sm:text-xs text-muted mt-0.5">
          Real-time vendor performance, detention tracking, and container movement — replacing manual Excel tracking.
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3 mb-5">
        <KpiCard label="Total Loads"      value={data?.kpis?.total}              icon={Truck}        color="gold"   loading={isLoading} />
        <KpiCard label=">25H Detention"   value={data?.kpis?.over25}             icon={AlertTriangle} color="red"    loading={isLoading} sub={`${pct(data?.kpis?.violationRate)} rate`} />
        <KpiCard label="Fix Loads"        value={data?.kpis?.fixLoads}           icon={Wrench}        color="blue"   loading={isLoading} />
        <KpiCard label="Non-Fix Loads"    value={data?.kpis?.nonFixLoads}        icon={Package}       color="green"  loading={isLoading} />
        <KpiCard label="Avg Hours"        value={data?.kpis?.avgHours}           icon={Clock}         color="cyan"   loading={isLoading} sub={`Max: ${data?.kpis?.maxHours?.toFixed(1) ?? '—'}h`} />
        <KpiCard label="Unique Vehicles"  value={data?.kpis?.uniqueVehicles}     icon={Truck}         color="purple" loading={isLoading} />
        <KpiCard label="Transporters"     value={data?.kpis?.uniqueTransporters} icon={Activity}      color="gold"   loading={isLoading} />
        <KpiCard label="Divisions"        value={data?.kpis?.uniqueDivisions}    icon={BarChart2}     color="green"  loading={isLoading} />
      </div>

      {/* Quick action cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <Link href="/upload" className="panel-card flex items-center gap-3 hover:ring-1 hover:ring-gold/30 transition-all group">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/10 ring-1 ring-gold/20 group-hover:bg-gold/20 transition-colors">
            <UploadIcon size={18} className="text-gold" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-text">Upload Data</div>
            <div className="text-[10px] text-muted">Import a new SAP export</div>
          </div>
        </Link>
        <Link href="/alerts" className="panel-card flex items-center gap-3 hover:ring-1 hover:ring-red/30 transition-all group">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red/10 ring-1 ring-red/20 group-hover:bg-red/20 transition-colors">
            <AlertTriangle size={18} className="text-red" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-text">View Alerts</div>
            <div className="text-[10px] text-muted">{fmtNum(data?.kpis?.over25)} detention cases</div>
          </div>
        </Link>
        <Link href="/settings/transporters" className="panel-card flex items-center gap-3 hover:ring-1 hover:ring-blue/30 transition-all group">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue/10 ring-1 ring-blue/20 group-hover:bg-blue/20 transition-colors">
            <Users2 size={18} className="text-blue" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-text">Manage Transporters</div>
            <div className="text-[10px] text-muted">Fix / Non-Fix master list</div>
          </div>
        </Link>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">
        <div className="xl:col-span-2 panel-card">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-bold text-text">Monthly Trend</h3>
            <span className="badge bg-panel3 text-muted2 ring-1 ring-line">Bar chart</span>
          </div>
          <MonthlyBarChart data={monthly} loading={isLoading} />
        </div>
        <div className="panel-card">
          <div className="mb-3 text-xs font-bold text-text">By Division</div>
          <DivisionDonutChart data={byDivision} loading={isLoading} />
        </div>
      </div>

      {/* Top transporters + heatmap row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
        <div className="panel-card">
          <div className="mb-3 text-xs font-bold text-text">Top 5 Transporters by Volume</div>
          <TopTransportersChart data={byTransporter} loading={isLoading} />
        </div>
        <div className="panel-card">
          <div className="mb-3 text-xs font-bold text-text">Loads by Day of Week</div>
          <HeatmapGrid data={byDayOfWeek} loading={isLoading} />
        </div>
      </div>

      {/* Daily trend */}
      <div className="panel-card mb-4">
        <div className="mb-3 text-xs font-bold text-text">Daily Movement (last 30 days)</div>
        <DailyLineChart data={daily} loading={isLoading} />
      </div>

      {/* Transporter table + recent activity */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 panel-card">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-bold text-text">Transporter Performance</h3>
            <Link href="/vendors" className="text-[10px] text-gold hover:underline">View all →</Link>
          </div>
          <TransporterTable data={byTransporter} loading={isLoading} />
        </div>
        <div className="panel-card">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-bold text-text">Recent Activity</h3>
            <Link href="/upload" className="text-[10px] text-gold hover:underline">View all →</Link>
          </div>
          <RecentActivityFeed />
        </div>
      </div>
    </AppShell>
  );
}
