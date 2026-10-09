import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { LayoutDashboardIcon, LogInIcon, MenuIcon, XIcon } from 'lucide-react';
import { Logo } from './Logo';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import { initials } from '../../utils/format';

const links = [
{ to: '/', key: 'nav.home' },
{ to: '/#organizations', key: 'nav.organizations' },
{ to: '/#functions', key: 'nav.functions' }];


export function PublicHeader() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-navy-100 bg-white/95 backdrop-blur">
      <div className="pattern-band h-1 w-full" aria-hidden="true" />
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Logo />

        <nav aria-label="Asosiy menyu" className="hidden items-center gap-1 md:flex">
          {links.map((link) =>
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
            `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            isActive && link.to === '/' ? 'text-navy-900' : 'text-navy-600 hover:bg-navy-50 hover:text-navy-900'}`

            }>
            
              {t(link.key)}
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>
          {user ?
          <Link
            to="/admin"
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-navy-800 px-3 text-[13px] font-medium text-white transition-colors hover:bg-navy-900">
            
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 text-[11px] font-semibold">
                {initials(user)}
              </span>
              <span className="hidden sm:inline">{t('nav.admin')}</span>
              <LayoutDashboardIcon className="h-4 w-4 sm:hidden" aria-hidden="true" />
            </Link> :

          <Link to="/login" className="hidden sm:block">
              <Button size="sm" icon={<LogInIcon className="h-4 w-4" />}>
                {t('action.login')}
              </Button>
            </Link>
          }
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-label="Menyu"
            aria-expanded={open}
            className="rounded-lg p-2 text-navy-600 transition-colors hover:bg-navy-50 md:hidden">
            
            {open ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open &&
      <div className="border-t border-navy-100 bg-white px-4 py-3 md:hidden">
          <nav aria-label="Mobil menyu" className="flex flex-col gap-1">
            {links.map((link) =>
          <Link
            key={link.to}
            to={link.to}
            onClick={() => setOpen(false)}
            className="rounded-lg px-3 py-2 text-sm font-medium text-navy-700 hover:bg-navy-50">
            
                {t(link.key)}
              </Link>
          )}
            {!user &&
          <Link
            to="/login"
            onClick={() => setOpen(false)}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-teal-700 hover:bg-navy-50">
            
                {t('action.login')}
              </Link>
          }
          </nav>
          <div className="mt-3 border-t border-navy-100 pt-3 sm:hidden">
            <LanguageSwitcher />
          </div>
        </div>
      }
    </header>);

}