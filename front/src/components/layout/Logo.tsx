import { Link } from 'react-router-dom';
import { cn } from '../../lib/cn';
import { useI18n } from '../../contexts/i18n';

interface LogoProps {
  to?: string;
  compact?: boolean;
  className?: string;
}

export function Logo({ to = '/', compact = false, className }: LogoProps) {
  const { t } = useI18n();
  return (
    <Link to={to} aria-label={t('app.name')} className={cn('group flex min-w-0 items-center gap-2.5 rounded-control', className)}>
      <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-brand-gradient text-white shadow-glow transition-transform duration-base ease-spring group-hover:scale-105 motion-reduce:transform-none">
        <svg viewBox="0 0 48 48" className="h-[18px] w-[18px]" fill="currentColor" aria-hidden="true">
          <path d="M24 2c2.2 13.8 7.9 19.6 22 22-14.1 2.4-19.8 8.2-22 22-2.2-13.8-7.9-19.6-22-22C16.1 21.6 21.8 15.8 24 2Z" />
        </svg>
      </span>
      {!compact && (
        <span className="min-w-0 leading-tight">
          <span className="block truncate font-display text-base font-bold tracking-tight text-content-strong">{t('app.name')}</span>
          <span className="hidden max-w-[13rem] truncate text-[11px] text-content-muted sm:block">{t('app.tagline')}</span>
        </span>
      )}
    </Link>
  );
}
