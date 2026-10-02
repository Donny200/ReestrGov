import { ArrowUpRightIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { homeRouteForRole, useAuth } from '../../contexts/auth';
import { useI18n } from '../../contexts/i18n';
import { Logo } from './Logo';

const linkClass =
  'group inline-flex min-h-10 items-center gap-1.5 text-sm text-content-muted transition-colors duration-fast hover:text-content-strong';

export function PublicFooter() {
  const { t } = useI18n();
  const { user } = useAuth();

  return (
    <footer className="border-t border-line/80 bg-surface/60">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 sm:px-6 sm:py-14 md:grid-cols-[minmax(0,1.5fr)_1fr_1fr] lg:px-8">
        <div className="max-w-md">
          <Logo />
          <p className="mt-5 max-w-sm text-sm leading-6 text-content-muted">{t('app.tagline')}</p>
          <p className="mt-5 border-l-2 border-brand pl-4 text-xs leading-5 text-content-muted">{t('app.demoNotice')}</p>
        </div>

        <nav aria-label={t('nav.catalog')}>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-content-subtle">{t('nav.catalog')}</p>
          <ul className="mt-3 space-y-1">
            <li><Link to="/" className={linkClass}>{t('nav.home')}</Link></li>
            <li><Link to="/#organizations" className={linkClass}>{t('nav.organizations')}</Link></li>
            <li><Link to="/#functions" className={linkClass}>{t('nav.functions')}</Link></li>
          </ul>
        </nav>

        <nav aria-label={t('nav.admin')}>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-content-subtle">{t('nav.admin')}</p>
          <ul className="mt-3 space-y-1">
            <li>
              <Link to={user ? homeRouteForRole(user.role) : '/login'} className={linkClass}>
                {user ? t('nav.admin') : t('action.login')}
                <ArrowUpRightIcon
                  className="h-3.5 w-3.5 opacity-60 transition-transform duration-fast group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transform-none"
                  aria-hidden="true"
                />
              </Link>
            </li>
            <li><Link to="/settings/security" className={linkClass}>{t('nav.security')}</Link></li>
          </ul>
        </nav>
      </div>

      <div className="border-t border-line/80">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-5 text-xs leading-5 text-content-subtle sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} {t('app.name')}</p>
          <p>{t('app.demoNotice')}</p>
        </div>
      </div>
    </footer>
  );
}
