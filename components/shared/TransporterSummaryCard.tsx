'use client';
import { fmtNum, fmtHours, pct } from '@/lib/utils';
import SparklineChart from '@/components/charts/SparklineChart';
import CountUpNumber from './CountUpNumber';
import { Truck } from 'lucide-react';
import type { TransporterStats } from '@/types';

interface TransporterSummaryCardProps {
  vendor: TransporterStats;
  trend: number[]; // recent monthly volumes, oldest -> newest
  rank: number;
}

// Simple, explainable performance score: rewards volume (capacity/reliability
// signal) and penalizes detention rate (consistency signal). Not a black box —
// shown so the number is easy to sanity-check.
function scoreFor(v: TransporterStats): number {
  const volumeScore = Math.min(100, (v.total / 50) * 60); // caps at ~50 loads
  const consistencyScore = Math.max(0, 40 - (v.violationRate ?? 0) * 0.4);
  return Math.round(volumeScore + consistencyScore);
}

function scoreBadge(score: number): { label: string; cls: string } {
  if (score >= 80) return { label: 'Excellent', cls: 'bg-green/10 text-green ring-1 ring-green/20' };
  if (score >= 60) return { label: 'Good', cls: 'bg-blue/10 text-blue ring-1 ring-blue/20' };
  if (score >= 40) return { label: 'Fair', cls: 'bg-gold/10 text-gold ring-1 ring-gold/20' };
  return { label: 'Needs Review', cls: 'bg-red/10 text-red ring-1 ring-red/20' };
}

export default function TransporterSummaryCard({ vendor, trend, rank }: TransporterSummaryCardProps) {
  const score = scoreFor(vendor);
  const badge = scoreBadge(score);
  const vr = vendor.violationRate ?? 0;

  return (
    <div className="panel-card ring-1 ring-line hover:ring-gold/30 transition-all animate-fade-up">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-panel3 ring-1 ring-line">
            <Truck size={14} className="text-muted" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-xs font-bold text-text">{vendor.transporter}</div>
            <div className="text-[9px] text-muted2">Rank #{rank}</div>
          </div>
        </div>
        <span className={`badge shrink-0 ${badge.cls}`}>{badge.label}</span>
      </div>

      <SparklineChart data={trend} color={vr > 20 ? '#ef4444' : vr > 10 ? '#f59e0b' : '#10b981'} className="mb-3" />

      <div className="grid grid-cols-4 gap-1 text-center mb-3">
        {[
          { label: 'Total', value: fmtNum(vendor.total), cls: 'text-gold' },
          { label: 'Fix', value: fmtNum(vendor.fix), cls: 'text-blue' },
          { label: 'Avg Hrs', value: fmtHours(vendor.avgHours), cls: 'text-muted' },
          { label: 'Max Hrs', value: fmtHours(vendor.maxHours), cls: 'text-muted' },
        ].map(({ label, value, cls }) => (
          <div key={label}>
            <div className={`text-xs font-bold font-mono ${cls}`}>{value}</div>
            <div className="text-[9px] text-muted2 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-line pt-2.5">
        <span className="text-[9px] font-bold uppercase tracking-wide text-muted2">Detention Rate</span>
        <span className={`text-xs font-bold font-mono ${vr > 20 ? 'text-red' : vr > 10 ? 'text-gold' : 'text-green'}`}>
          <CountUpNumber value={vr} decimals={1} formatter={pct} />
        </span>
      </div>
    </div>
  );
}
