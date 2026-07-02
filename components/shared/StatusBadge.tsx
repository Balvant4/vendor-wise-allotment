import { cn } from '@/lib/utils';

export type DetentionSeverity = 'ok' | 'low' | 'medium' | 'high';

// 25-48h = Orange (low), 48-72h = Red (medium), 72h+ = Dark Red + pulsing (high)
export function severityFromHours(hours?: number | null): DetentionSeverity {
  if (!hours || hours < 25) return 'ok';
  if (hours < 48) return 'low';
  if (hours < 72) return 'medium';
  return 'high';
}

const styles: Record<DetentionSeverity, string> = {
  ok:     'bg-green/10 text-green ring-1 ring-green/20',
  low:    'bg-orange-500/10 text-orange-400 ring-1 ring-orange-500/25',
  medium: 'bg-red/10 text-red ring-1 ring-red/25',
  high:   'bg-reddark text-red ring-1 ring-red/40 animate-pulse',
};

const labels: Record<DetentionSeverity, string> = {
  ok:     'OK',
  low:    'Company Detention',
  medium: 'Company Detention',
  high:   'Company Detention',
};

interface StatusBadgeProps {
  severity: DetentionSeverity;
  className?: string;
  showDot?: boolean;
}

export default function StatusBadge({ severity, className, showDot = true }: StatusBadgeProps) {
  return (
    <span className={cn('badge gap-1', styles[severity], className)}>
      {showDot && severity !== 'ok' && (
        <span className={cn('h-1.5 w-1.5 rounded-full', severity === 'high' ? 'bg-red' : severity === 'medium' ? 'bg-red' : 'bg-orange-400')} />
      )}
      {labels[severity]}
    </span>
  );
}
