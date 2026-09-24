import { ArrowUpRightIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { homeRouteForRole, useAuth } from '../../contexts/auth';
import { useI18n } from '../../contexts/i18n';
import { Logo } from './Logo';

export function PublicFooter() {
  const { t } = useI18n();
  const { user } = useAuth();
  const linkClass =
    'group inline-flex min-h-11 items-center gap-1.5 py-2 text-sm text-white/60 transition-colors hover:text-white';

  return (
    <footer className="border-t border-brand bg-brand text-white/70">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 sm:px-6 sm:py-14 md:grid-cols-[minmax(0,1.5fr)_1fr_1fr] lg:px-8">
        <div className="max-w-md">
          <Logo tone="light" />
          <p className="mt-5 max-w-sm text-sm leading-6 text-white/55">{t('app.tagline')}</p>
          <p className="mt-5 border-l-2 border-accent pl-4 text-xs leading-5 text-white/55">
            {t('app.demoNotice')}
          </p>
        </div>

        <nav aria-label={t('nav.catalog')}>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/40">{t('nav.catalog')}</p>
          <ul className="mt-3">
            <li><Link to="/" className={linkClass}>{t('nav.home')}</Link></li>
            <li><Link to="/#organizations" className={linkClass}>{t('nav.organizations')}</Link></li>
            <li><Link to="/#functions" className={linkClass}>{t('nav.functions')}</Link></li>
          </ul>
        </nav>

        <nav aria-label={t('nav.admin')}>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/40">{t('nav.admin')}</p>
          <ul className="mt-3">
            <li>
              <Link to={user ? homeRouteForRole(user.role) : '/login'} className={linkClass}>
                {user ? t('nav.admin') : t('action.login')}
                <ArrowUpRightIcon
                  className="h-3.5 w-3.5 opacity-60 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transform-none"
                  aria-hidden="true"
                />
              </Link>
            </li>
            <li><Link to="/settings/security" className={linkClass}>{t('nav.security')}</Link></li>
          </ul>
        </nav>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-5 text-xs leading-5 text-white/40 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} Reestr Task</p>
          <p>{t('app.demoNotice')}</p>
        </div>
      </div>
    </footer>
  );
}
