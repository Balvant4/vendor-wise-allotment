'use client';
import AppShell from '@/components/layout/AppShell';
import KpiCard from '@/components/shared/KpiCard';
import { useDashboardOverview } from '@/features/dashboard/hooks/useDashboard';
import { useFilters } from '@/features/dashboard/components/FilterProvider';
import { fmtHours, fmtNum, pct } from '@/lib/utils';
import {
  Truck, Package, AlertTriangle, Wrench,
  BarChart2, Clock, Activity, TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import MonthlyBarChart from '@/components/charts/MonthlyBarChart';
import DailyLineChart from '@/components/charts/DailyLineChart';
import DivisionDonutChart from '@/components/charts/DivisionDonutChart';
import type { TransporterStats } from '@/types';

function TransporterTable({ data = [], loading }: { data: TransporterStats[]; loading: boolean }) {
  if (loading) return <div className="skeleton h-40 rounded-lg" />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
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

export default function DashboardPage() {
  const { filters } = useFilters();
  const { data, isLoading } = useDashboardOverview(filters);

 const kpis          = data?.kpis          ?? ({} as NonNullable<typeof data>['kpis']);
  const monthly       = data?.monthly       ?? [];
  const daily         = data?.daily         ?? [];
  const byDivision    = data?.byDivision    ?? [];
  const byTransporter = data?.byTransporter ?? [];

  return (
    <AppShell title="Dashboard">
      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3 mb-5">
        <KpiCard label="Total Loads"     value={data?.kpis?.total}               icon={Truck}         color="gold"   loading={isLoading} />
        <KpiCard label=">25H Violations" value={data?.kpis?.over25}              icon={AlertTriangle}  color="red"    loading={isLoading} sub={`${pct(data?.kpis?.violationRate)} rate`} />
        <KpiCard label="Fix Loads"       value={data?.kpis?.fixLoads}            icon={Wrench}         color="blue"   loading={isLoading} />
        <KpiCard label="Non-Fix Loads"   value={data?.kpis?.nonFixLoads}         icon={Package}        color="green"  loading={isLoading} />
        <KpiCard label="Avg Hours"       value={data?.kpis?.avgHours}            icon={Clock}          color="cyan"   loading={isLoading} sub={`Max: ${data?.kpis?.maxHours?.toFixed(1)}h`} />
        <KpiCard label="Unique Vehicles" value={data?.kpis?.uniqueVehicles}      icon={Truck}          color="purple" loading={isLoading} />
        <KpiCard label="Transporters"    value={data?.kpis?.uniqueTransporters}  icon={Activity}       color="gold"   loading={isLoading} />
        <KpiCard label="Divisions"       value={data?.kpis?.uniqueDivisions}     icon={BarChart2}      color="green"  loading={isLoading} />
      </div>

      {/* Quick links */}
      <div className="flex gap-2 mb-5 flex-wrap">
        <Link href="/alerts" className="btn-danger text-xs py-1.5">
          <AlertTriangle size={12} /> View Alerts ({fmtNum(data?.kpis?.over25)})
        </Link>
        <Link href="/vehicles" className="btn-ghost text-xs py-1.5">
          <Truck size={12} /> All Records
        </Link>
        <Link href="/upload" className="btn-success text-xs py-1.5">
          <TrendingUp size={12} /> Upload Data
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

      {/* Daily trend */}
      <div className="panel-card mb-4">
        <div className="mb-3 text-xs font-bold text-text">Daily Movement (last 30 days)</div>
        <DailyLineChart data={daily} loading={isLoading} />
      </div>

      {/* Transporter table */}
      <div className="panel-card">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-bold text-text">Transporter Performance</h3>
          <Link href="/vendors" className="text-[10px] text-gold hover:underline">View all →</Link>
        </div>
        <TransporterTable data={byTransporter} loading={isLoading} />
      </div>
    </AppShell>
  );
}
