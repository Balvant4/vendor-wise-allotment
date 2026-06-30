import { cn } from '@/lib/utils';

const variants = {
  gold:   'bg-gold/10   text-gold   ring-1 ring-gold/20',
  green:  'bg-green/10  text-green  ring-1 ring-green/20',
  red:    'bg-red/10    text-red    ring-1 ring-red/20',
  blue:   'bg-blue/10   text-blue   ring-1 ring-blue/20',
  gray:   'bg-panel3    text-muted2 ring-1 ring-line',
  purple: 'bg-purple/10 text-purple ring-1 ring-purple/20',
} as const;

interface BadgeProps {
  variant?: keyof typeof variants;
  children: React.ReactNode;
  className?: string;
}

export default function Badge({ variant = 'gray', children, className }: BadgeProps) {
  return (
    <span className={cn('badge', variants[variant], className)}>
      {children}
    </span>
  );
}
