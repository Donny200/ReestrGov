import { ArrowLeftIcon, SearchXIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { buttonVariants } from '../components/ui/buttonVariants';
import { useI18n } from '../contexts/i18n';
import { cn } from '../lib/cn';

export function NotFound() {
  const { t } = useI18n();

  return (
    <div className="mx-auto flex min-h-[65vh] w-full max-w-2xl animate-fade-up flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
      <div className="glass w-full rounded-overlay p-10 shadow-elevated">
        <p className="text-gradient font-display text-7xl font-bold leading-none tracking-tight sm:text-8xl">404</p>
        <span className="mx-auto mt-6 flex h-12 w-12 items-center justify-center rounded-surface bg-brand-gradient-soft text-link">
          <SearchXIcon className="h-6 w-6" aria-hidden="true" />
        </span>
        <h1 className="mt-5 font-display text-2xl font-bold tracking-tight text-content-strong sm:text-3xl">{t('state.notFoundTitle')}</h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-content-muted">{t('state.notFoundText')}</p>
        <Link to="/" className={cn(buttonVariants({ size: 'lg' }), 'mt-7')}>
          <ArrowLeftIcon className="rtl:rotate-180" aria-hidden="true" />
          {t('nav.home')}
        </Link>
      </div>
    </div>
  );
}
