import { cn } from '../../lib/cn';
import { useI18n } from '../../contexts/i18n';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'relative overflow-hidden rounded-md bg-surface-subtle before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/50 before:to-transparent dark:before:via-white/10 motion-reduce:before:animate-none',
        className,
      )}
    />
  );
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  const { t } = useI18n();
  return (
    <div className={cn('space-y-2.5', className)} role="status" aria-live="polite">
      <span className="sr-only">{t('state.loading')}</span>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton key={index} className={index === lines - 1 ? 'h-3.5 w-2/3' : 'h-3.5 w-full'} />
      ))}
    </div>
  );
}

export function SkeletonCards({ count = 6 }: { count?: number }) {
  const { t } = useI18n();
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-live="polite">
      <span className="sr-only">{t('state.loading')}</span>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rounded-surface border border-line bg-surface p-5 shadow-card">
          <div className="flex items-start justify-between">
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
          <Skeleton className="mt-5 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-3/4" />
          <Skeleton className="mt-6 h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonRows({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  const { t } = useI18n();
  return (
    <div className="divide-y divide-line" role="status" aria-live="polite">
      <span className="sr-only">{t('state.loading')}</span>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="px-5 py-4">
          <div className="grid gap-3 lg:hidden">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <div className="hidden items-center gap-4 lg:flex">
            {Array.from({ length: columns }).map((__, colIndex) => (
              <Skeleton key={colIndex} className={colIndex === 0 ? 'h-3.5 w-10' : 'h-3.5 flex-1'} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonStat() {
  return (
    <div className="rounded-surface border border-line bg-surface p-5 shadow-card">
      <div className="flex items-start justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-9 w-9 rounded-control" />
      </div>
      <Skeleton className="mt-4 h-8 w-20" />
      <Skeleton className="mt-3 h-3 w-32" />
    </div>
  );
}
