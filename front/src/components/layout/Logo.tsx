import { Link } from 'react-router-dom';
import { useI18n } from '../../contexts/i18n';

export function Logo({ to = '/', tone = 'dark' }: { to?: string; tone?: 'dark' | 'light' }) {
  const { t } = useI18n();
  const isLight = tone === 'light';

  return (
    <Link to={to} className="group flex min-h-11 min-w-0 items-center gap-2.5 rounded-full">
      <span
        className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors ${
          isLight
            ? 'border-white/15 bg-white/10 text-white group-hover:bg-white/15'
            : 'border-brand bg-brand text-white group-hover:bg-brand-hover'
        }`}
      >
        <svg viewBox="0 0 48 48" className="h-[18px] w-[18px] text-accent" fill="currentColor" aria-hidden="true"><path d="M24 2c2.2 13.8 7.9 19.6 22 22-14.1 2.4-19.8 8.2-22 22-2.2-13.8-7.9-19.6-22-22C16.1 21.6 21.8 15.8 24 2Z" /></svg>
      </span>
      <span className="min-w-0 leading-tight">
        <span
          className={`block truncate font-display text-[17px] font-extrabold tracking-tight ${
            isLight ? 'text-white' : 'text-content-strong'
          }`}
        >
          {t('app.name')}
        </span>
        <span
          className={`hidden max-w-[13rem] truncate text-[11px] sm:block ${
            isLight ? 'text-white/45' : 'text-content-muted'
          }`}
        >
          {t('app.tagline')}
        </span>
      </span>
    </Link>
  );
}
