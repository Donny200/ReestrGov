import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useI18n } from '../contexts/I18nContext';

export function NotFound() {
  const { t } = useI18n();

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center px-4 py-24 text-center">
      <p className="font-display text-5xl font-extrabold text-navy-200">404</p>
      <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight text-navy-900">
        {t('state.notFoundTitle')}
      </h1>
      <p className="mt-2 text-sm text-navy-500">{t('state.notFoundText')}</p>
      <Link to="/" className="mt-6">
        <Button>{t('nav.home')}</Button>
      </Link>
    </div>);

}