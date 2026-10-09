import React from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../contexts/I18nContext';

export function PublicFooter() {
  const { t } = useI18n();

  return (
    <footer className="mt-16 border-t border-navy-800 bg-navy-900 text-navy-200">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <p className="font-display text-lg font-extrabold text-white">Reestr Task</p>
          <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-navy-300">{t('app.tagline')}</p>
          <p className="mt-4 max-w-xs rounded-lg bg-navy-800 px-3 py-2 text-[12px] leading-relaxed text-navy-300">
            {t('app.demoNotice')}
          </p>
        </div>
        <nav aria-label="Katalog" className="text-[13px]">
          <p className="font-semibold text-white">{t('nav.catalog')}</p>
          <ul className="mt-3 space-y-2">
            <li>
              <Link to="/" className="text-navy-300 transition-colors hover:text-white">
                {t('nav.home')}
              </Link>
            </li>
            <li>
              <Link to="/#organizations" className="text-navy-300 transition-colors hover:text-white">
                {t('nav.organizations')}
              </Link>
            </li>
            <li>
              <Link to="/#functions" className="text-navy-300 transition-colors hover:text-white">
                {t('nav.functions')}
              </Link>
            </li>
          </ul>
        </nav>
        <nav aria-label="Xodimlar uchun" className="text-[13px]">
          <p className="font-semibold text-white">{t('nav.admin')}</p>
          <ul className="mt-3 space-y-2">
            <li>
              <Link to="/login" className="text-navy-300 transition-colors hover:text-white">
                {t('action.login')}
              </Link>
            </li>
            <li>
              <Link to="/settings/security" className="text-navy-300 transition-colors hover:text-white">
                {t('nav.security')}
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-navy-800 px-4 py-5 text-center text-[12px] text-navy-400 sm:px-6 lg:px-8">
        © {new Date().getFullYear()} Reestr Task — demo loyiha. Rasmiy davlat portali emas.
      </div>
    </footer>);

}