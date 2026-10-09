import React, { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import {
  ArrowLeftIcon,
  BuildingIcon,
  DatabaseIcon,
  GlobeIcon,
  KeyIcon,
  LayoutDashboardIcon,
  ListIcon,
  LockIcon,
  LogOutIcon,
  MenuIcon,
  ShieldCheckIcon,
  UsersIcon } from
'lucide-react';
import { Logo } from './Logo';
import { LanguageSwitcher } from './LanguageSwitcher';
import { navForRole, type AdminNavItem } from './adminNav';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import { fullName, initials, roleLabel } from '../../utils/format';

const icons: Record<AdminNavItem['icon'], React.ComponentType<{className?: string;}>> = {
  dashboard: LayoutDashboardIcon,
  building: BuildingIcon,
  shield: ShieldCheckIcon,
  users: UsersIcon,
  key: KeyIcon,
  globe: GlobeIcon,
  legacy: DatabaseIcon,
  lock: LockIcon,
  catalog: ListIcon
};

export function AdminLayout() {
  const { t } = useI18n();
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const items = navForRole(user?.role);

  const sidebar =
  <div className="flex h-full flex-col bg-navy-900">
      <div className="px-5 py-5">
        <Logo to="/admin" tone="light" />
      </div>
      <nav aria-label="Boshqaruv menyusi" className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {items.map((item) => {
        const Icon = icons[item.icon];
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-medium transition-colors ${
            isActive ? 'bg-teal-600 text-white' : 'text-navy-200 hover:bg-navy-800 hover:text-white'}`

            }>
            
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {t(item.labelKey)}
            </NavLink>);

      })}
      </nav>
      <div className="border-t border-navy-800 px-3 py-4">
        <Link
        to="/"
        className="flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-navy-300 transition-colors hover:bg-navy-800 hover:text-white">
        
          <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
          {t('nav.backToSite')}
        </Link>
      </div>
    </div>;


  return (
    <div className="flex min-h-screen w-full bg-[#f4f6f9]">
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="fixed inset-y-0 w-64">{sidebar}</div>
      </aside>

      {open &&
      <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-navy-950/50" onClick={() => setOpen(false)} />
          <div className="relative z-10 h-full w-72">{sidebar}</div>
        </div>
      }

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-navy-100 bg-white/95 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Menyu"
              className="rounded-lg p-2 text-navy-600 transition-colors hover:bg-navy-50 lg:hidden">
              
              <MenuIcon className="h-5 w-5" />
            </button>
            <div className="hidden sm:block">
              <p className="font-display text-sm font-semibold text-navy-900">{t('nav.admin')}</p>
              <p className="text-[12px] text-navy-400">Reestr Task</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            {user &&
            <div className="flex items-center gap-2.5 rounded-lg border border-navy-100 px-2.5 py-1.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-navy-800 text-[11px] font-semibold text-white">
                  {initials(user)}
                </span>
                <span className="hidden leading-tight sm:block">
                  <span className="block text-[13px] font-medium text-navy-900">{fullName(user)}</span>
                  <span className="block text-[11px] text-navy-400">{roleLabel(user.role)}</span>
                </span>
              </div>
            }
            <button
              type="button"
              onClick={() => void signOut()}
              aria-label={t('action.logout')}
              className="rounded-lg p-2 text-navy-500 transition-colors hover:bg-red-50 hover:text-red-600">
              
              <LogOutIcon className="h-[18px] w-[18px]" />
            </button>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
          <div className="mx-auto w-full max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>);

}

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
}

export function PageHeader({ title, description, actions, badge }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="font-display text-xl font-extrabold tracking-tight text-navy-900 sm:text-2xl">{title}</h1>
          {badge}
        </div>
        {description && <p className="mt-1 max-w-2xl text-sm text-navy-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>);

}