import { useEffect, useRef, useState } from 'react';
import type { ComponentType, ReactNode } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  ArrowLeftIcon,
  BuildingIcon,
  DatabaseIcon,
  GlobeIcon,
  KeyIcon,
  LayoutDashboardIcon,
  LockIcon,
  LogOutIcon,
  MenuIcon,
  ShieldCheckIcon,
  UsersIcon,
  XIcon,
} from 'lucide-react';
import { Logo } from './Logo';
import { LanguageSwitcher } from './LanguageSwitcher';
import { navForRole, type AdminNavItem } from './adminNav';
import { useAuth } from '../../contexts/auth';
import { useI18n } from '../../contexts/i18n';
import { fullName, initials, roleLabel } from '../../utils/format';

const icons: Record<AdminNavItem['icon'], ComponentType<{ className?: string }>> = {
  dashboard: LayoutDashboardIcon,
  building: BuildingIcon,
  shield: ShieldCheckIcon,
  users: UsersIcon,
  key: KeyIcon,
  globe: GlobeIcon,
  legacy: DatabaseIcon,
  lock: LockIcon,
};

const SIDEBAR_ID = 'admin-navigation';

export function AdminLayout() {
  const { t } = useI18n();
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const items = navForRole(user?.role);

  const currentItem = [...items]
    .reverse()
    .find((item) => item.end ? location.pathname === item.to : location.pathname.startsWith(item.to));
  const currentPageTitle = location.pathname.startsWith('/admin/functions/')
    ? t('fnEdit.title')
    : currentItem
      ? t(currentItem.labelKey)
      : t('nav.admin');

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const frame = window.requestAnimationFrame(() => {
      drawerRef.current?.querySelector<HTMLElement>('a[href], button:not([disabled]), select:not([disabled])')?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        menuButtonRef.current?.focus();
        return;
      }

      if (event.key !== 'Tab' || !drawerRef.current) return;
      const focusable = Array.from(
        drawerRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const closeDrawer = () => {
    setOpen(false);
    menuButtonRef.current?.focus();
  };

  const sidebar = (mobile = false) => (
    <div className="relative flex h-full flex-col overflow-hidden bg-brand text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-accent" />

      <div className="flex min-h-[76px] items-center justify-between gap-3 border-b border-white/10 px-5">
        <div onClick={mobile ? closeDrawer : undefined}>
          <Logo to="/admin" tone="light" />
        </div>
        {mobile && (
          <button
            type="button"
            onClick={closeDrawer}
            aria-label={t('action.close')}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-navy-200 transition-colors hover:bg-white/10 hover:text-white"
          >
            <XIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
      </div>

      <nav aria-label={t('nav.admin')} className="flex-1 overflow-y-auto px-3 py-5">
        <div className="space-y-1">
          {items.map((item) => {
            const Icon = icons[item.icon];
            return (
              <div key={item.to} className={item.dividerBefore ? 'mt-4 border-t border-white/10 pt-4' : undefined}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  onClick={mobile ? closeDrawer : () => setOpen(false)}
                  className={({ isActive }) =>
                    `group relative flex min-h-11 items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13.5px] font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-white/[0.11] text-white shadow-sm ring-1 ring-inset ring-white/10'
                        : 'text-white/55 hover:bg-white/[0.06] hover:text-white'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={`absolute inset-y-2 left-0 w-0.5 rounded-full transition-colors ${
                          isActive ? 'bg-accent' : 'bg-transparent'
                        }`}
                        aria-hidden="true"
                      />
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                          isActive ? 'bg-accent/20 text-accent' : 'text-white/35 group-hover:text-white/80'
                        }`}
                      >
                        <Icon className="h-[17px] w-[17px]" aria-hidden="true" />
                      </span>
                      <span className="truncate">{t(item.labelKey)}</span>
                    </>
                  )}
                </NavLink>
              </div>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-white/10 px-3 py-4">
        <Link
          to="/"
          className="flex min-h-11 items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-medium text-white/55 transition-colors hover:bg-white/[0.06] hover:text-white"
        >
          <ArrowLeftIcon className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
          {t('nav.backToSite')}
        </Link>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full bg-canvas">
      <aside className="hidden w-[17.5rem] shrink-0 lg:block" aria-label={t('nav.admin')}>
        <div className="fixed inset-y-0 z-40 w-[17.5rem]">{sidebar()}</div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            tabIndex={-1}
            aria-label={t('action.close')}
            onClick={closeDrawer}
            className="absolute inset-0 h-full w-full cursor-default bg-brand/70 backdrop-blur-[2px]"
          />
          <div
            ref={drawerRef}
            id={SIDEBAR_ID}
            role="dialog"
            aria-modal="true"
            aria-label={t('nav.admin')}
            tabIndex={-1}
            className="relative z-10 h-full w-[min(19rem,88vw)] shadow-2xl outline-none"
          >
            {sidebar(true)}
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b border-line/90 bg-white/90 px-3 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setOpen(true)}
              aria-label={t('nav.admin')}
              aria-controls={SIDEBAR_ID}
              aria-expanded={open}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-navy-600 transition-colors hover:bg-navy-50 hover:text-navy-900 lg:hidden"
            >
              <MenuIcon className="h-5 w-5" aria-hidden="true" />
            </button>
            <div className="hidden min-w-0 sm:block">
              <p className="truncate font-display text-sm font-semibold text-navy-900">{currentPageTitle}</p>
              <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.14em] text-navy-400">Reestr Task</p>
            </div>
          </div>

          <div className="flex min-w-0 items-center gap-1.5 sm:gap-2.5">
            <div className="max-w-32 sm:max-w-none">
              <LanguageSwitcher compact />
            </div>
            {user && (
              <div className="flex min-h-11 items-center gap-2.5 rounded-xl border border-navy-100 bg-white px-2 shadow-sm sm:px-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-navy-900 text-[11px] font-semibold tracking-wide text-white">
                  {initials(user)}
                </span>
                <span className="hidden min-w-0 leading-tight md:block">
                  <span className="block max-w-44 truncate text-[13px] font-semibold text-navy-900">{fullName(user)}</span>
                  <span className="mt-0.5 block text-[11px] text-navy-400">{roleLabel(user.role, t)}</span>
                </span>
              </div>
            )}
            <button
              type="button"
              onClick={() => void signOut()}
              aria-label={t('action.logout')}
              title={t('action.logout')}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-navy-500 transition-colors hover:bg-red-50 hover:text-red-600"
            >
              <LogOutIcon className="h-[18px] w-[18px]" aria-hidden="true" />
            </button>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
          <div className="mx-auto w-full max-w-[90rem]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  badge?: ReactNode;
}

export function PageHeader({ title, description, actions, badge }: PageHeaderProps) {
  return (
    <header className="mb-7 border-b border-line pb-6 sm:mb-8 sm:pb-7">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="h-6 w-1 rounded-full bg-teal-500" aria-hidden="true" />
            <h1 className="font-display text-2xl font-extrabold tracking-[-0.025em] text-navy-950 sm:text-[28px]">
              {title}
            </h1>
            {badge}
          </div>
          {description && <p className="mt-2 max-w-3xl text-sm leading-6 text-navy-500">{description}</p>}
        </div>
        {actions && (
          <div className="flex w-full flex-wrap items-center gap-2 [&>button]:flex-1 sm:w-auto sm:[&>button]:flex-none">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}
