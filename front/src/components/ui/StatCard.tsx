import type { ComponentType } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRightIcon } from 'lucide-react';
import { cn } from '../../lib/cn';
import { Skeleton } from './Skeleton';
import { useAnimatedNumber } from '../../hooks/useAnimatedNumber';

interface StatCardProps {
  label: string;
  value: number;
  hint?: string;
  icon: ComponentType<{ className?: string }>;
  to?: string;
  loading?: boolean;
  tone?: 'brand' | 'success' | 'warning' | 'info';
  className?: string;
}

const tones = {
  brand: 'bg-brand-gradient-soft text-link',
  success: 'bg-positive/10 text-positive',
  warning: 'bg-warning/10 text-warning',
  info: 'bg-info/10 text-info',
};

export function StatCard({ label, value, hint, icon: Icon, to, loading = false, tone = 'brand', className }: StatCardProps) {
  const animated = useAnimatedNumber(loading ? 0 : value);
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-content-muted">{label}</span>
        <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-control shadow-xs', tones[tone])}>
          <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
        </span>
      </div>
      {loading ? (
        <Skeleton className="mt-4 h-9 w-20" />
      ) : (
        <p className="mt-4 font-display text-[2rem] font-bold leading-none tabular-nums tracking-tight text-content-strong">{animated}</p>
      )}
      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-content-muted">
        <span className="truncate">{hint}</span>
        {to && <ArrowUpRightIcon className="h-4 w-4 shrink-0 text-content-subtle transition-colors group-hover:text-link" aria-hidden="true" />}
      </div>
    </>
  );
  const shell = cn('group relative block overflow-hidden rounded-surface border border-line bg-surface p-5 shadow-card', to && 'lift', className);
  return to ? <Link to={to} className={shell}>{body}</Link> : <div className={shell}>{body}</div>;
}
