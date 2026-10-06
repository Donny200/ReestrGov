import { useEffect, useState, type ComponentType } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  BuildingIcon,
  DatabaseIcon,
  FileTextIcon,
  GlobeIcon,
  KeyIcon,
  LayoutDashboardIcon,
  LockIcon,
  LogOutIcon,
  MenuIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  ShieldCheckIcon,
  UsersIcon,
  XIcon,
} from 'lucide-react';
import { cn } from '../../lib/cn';
import { Logo } from './Logo';
import { LanguageSwitcher } from './LanguageSwitcher';
import { navForRole, type AdminNavItem } from './adminNav';
import { ThemeToggle } from '../ui/ThemeToggle';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { Tooltip } from '../ui/Tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/DropdownMenu';
import { useAuth } from '../../contexts/auth';
import { useI18n } from '../../contexts/i18n';
import { fullName, roleLabel } from '../../utils/format';

export { PageHeader } from './PageHeader';

const icons: Record<AdminNavItem['icon'], ComponentType<{ className?: string }>> = {
  functions: FileTextIcon,
  dashboard: LayoutDashboardIcon,
  building: BuildingIcon,
  shield: ShieldCheckIcon,
  users: UsersIcon,
  key: KeyIcon,
  globe: GlobeIcon,
  legacy: DatabaseIcon,
  lock: LockIcon,
};

const SIDEBAR_KEY = 'reestr-sidebar';

function readCollapsed(): boolean {
  try {
    return window.localStorage.getItem(SIDEBAR_KEY) === 'collapsed';
  } catch {
    return false;
  }
}

function SidebarNav({ items, collapsed, onNavigate }: { items: AdminNavItem[]; collapsed: boolean; onNavigate?: () => void }) {
  const { t } = useI18n();
  return (
    <nav aria-label={t('nav.admin')} className="flex-1 overflow-y-auto px-2.5 py-3">
      <ul className="space-y-0.5">
        {items.map((item) => {
          const Icon = icons[item.icon];
          const label = t(item.labelKey);
          const link = (
            <NavLink
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'group relative flex h-10 items-center gap-3 rounded-control px-3 text-sm font-medium transition-colors duration-fast',
                  isActive ? 'bg-brand-subtle text-link' : 'text-content-muted hover:bg-surface-subtle hover:text-content-strong',
                  collapsed && 'justify-center px-0',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-brand-gradient" aria-hidden="true" />}
                  <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                  <span className={cn('truncate', collapsed && 'sr-only')}>{label}</span>
                </>
              )}
            </NavLink>
          );
          return (
            <li key={item.to} className={cn(item.dividerBefore && 'mt-3 border-t border-line/80 pt-3')}>
              {collapsed ? <Tooltip content={label} side="right">{link}</Tooltip> : link}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function AdminLayout() {
  const { t } = useI18n();
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const items = navForRole(user?.role, user?.permissions);

  useEffect(() => setDrawerOpen(false), [location.pathname]);
  useEffect(() => {
    try {
      window.localStorage.setItem(SIDEBAR_KEY, collapsed ? 'collapsed' : 'expanded');
    } catch {
      return;
    }
  }, [collapsed]);
  useEffect(() => {
    if (!drawerOpen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDrawerOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', onKey);
    };
  }, [drawerOpen]);

  const currentItem = [...items].reverse().find((item) => (item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)));
  const pageTitle = location.pathname.startsWith('/admin/functions/') ? t('nav.functions') : currentItem ? t(currentItem.labelKey) : t('nav.admin');

  return (
    <div className="flex min-h-dvh w-full">
      <aside
        aria-label={t('nav.admin')}
        className={cn('glass hidden shrink-0 border-y-0 border-l-0 transition-[width] duration-base ease-spring lg:block', collapsed ? 'w-[4.5rem]' : 'w-64')}
      >
        <div className={cn('sticky top-0 flex h-dvh flex-col', collapsed ? 'w-[4.5rem]' : 'w-64')}>
          <div className={cn('flex h-16 items-center border-b border-line/80 px-4', collapsed && 'justify-center px-0')}>
            <Logo to="/admin" compact={collapsed} />
          </div>
          <SidebarNav items={items} collapsed={collapsed} />
          <div className="border-t border-line/80 p-2.5">
            <Link
              to="/"
              className={cn('flex h-10 items-center gap-3 rounded-control px-3 text-sm font-medium text-content-muted transition-colors hover:bg-surface-subtle hover:text-content-strong', collapsed && 'justify-center px-0')}
            >
              <ArrowLeftIcon className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
              <span className={cn(collapsed && 'sr-only')}>{t('nav.backToSite')}</span>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className={cn('mt-1 h-10 w-full justify-start text-content-muted', collapsed && 'justify-center')}
              onClick={() => setCollapsed((value) => !value)}
              aria-label={collapsed ? t('nav.expand', 'Expand sidebar') : t('nav.collapse', 'Collapse sidebar')}
              aria-pressed={collapsed}
            >
              {collapsed ? <PanelLeftOpenIcon aria-hidden="true" /> : <PanelLeftCloseIcon aria-hidden="true" />}
              <span className={cn(collapsed && 'sr-only')}>{t('nav.collapse', 'Collapse')}</span>
            </Button>
          </div>
        </div>
      </aside>

      <AnimatePresence>
        {drawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.button
              type="button"
              tabIndex={-1}
              aria-label={t('action.close')}
              onClick={() => setDrawerOpen(false)}
              className="absolute inset-0 h-full w-full cursor-default bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={t('nav.admin')}
              className="glass-strong relative z-10 flex h-full w-[min(18rem,88vw)] flex-col shadow-overlay"
              initial={{ x: -32, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -32, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex h-16 items-center justify-between border-b border-line/80 px-4">
                <Logo to="/admin" />
                <Button variant="ghost" size="iconSm" aria-label={t('action.close')} onClick={() => setDrawerOpen(false)}>
                  <XIcon aria-hidden="true" />
                </Button>
              </div>
              <SidebarNav items={items} collapsed={false} onNavigate={() => setDrawerOpen(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="glass sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-x-0 border-t-0 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setDrawerOpen(true)} aria-label={t('nav.admin')} aria-expanded={drawerOpen}>
              <MenuIcon aria-hidden="true" />
            </Button>
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-semibold text-content-strong">{pageTitle}</p>
              <p className="hidden text-[11px] font-medium uppercase tracking-[0.14em] text-content-subtle sm:block">{t('app.name')}</p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <ThemeToggle />
            <LanguageSwitcher compact />
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="press flex h-10 items-center gap-2 rounded-control border border-line bg-surface/80 px-1.5 shadow-xs transition-colors hover:bg-surface-subtle sm:pr-3"
                    aria-label={fullName(user)}
                  >
                    <Avatar user={user} size="sm" />
                    <span className="hidden max-w-40 truncate text-sm font-medium text-content-strong md:block">{fullName(user)}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-60">
                  <DropdownMenuLabel>
                    <span className="block truncate text-sm text-content-strong">{fullName(user)}</span>
                    <span className="block truncate font-normal">{roleLabel(user.role, t)} · {user.email}</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/settings/security"><LockIcon />{t('nav.security')}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem destructive onSelect={() => void signOut()}>
                    <LogOutIcon />{t('action.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
