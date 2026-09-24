import { useEffect, useId, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRightIcon, LayoutDashboardIcon, LogInIcon, MenuIcon, XIcon } from 'lucide-react';
import { Logo } from './Logo';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useAuth } from '../../contexts/auth';
import { useI18n } from '../../contexts/i18n';
import { initials } from '../../utils/format';

const links = [
  { to: '/', key: 'nav.home' },
  { to: '/#organizations', key: 'nav.organizations' },
  { to: '/#functions', key: 'nav.functions' }
] as const;

export function PublicHeader() {
  const { t } = useI18n();
  const { user, initializing } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const drawerTitleId = useId();

  useEffect(() => {
    setOpen(false);
  }, [location.hash, location.pathname]);

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)');
    const closeOnDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) setOpen(false);
    };
    desktop.addEventListener('change', closeOnDesktop);
    return () => desktop.removeEventListener('change', closeOnDesktop);
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const frame = window.requestAnimationFrame(() => {
      drawerRef.current?.querySelector<HTMLElement>('button, a, select')?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        window.requestAnimationFrame(() => menuButtonRef.current?.focus());
        return;
      }

      if (event.key !== 'Tab' || !drawerRef.current) return;
      const focusable = Array.from(
        drawerRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
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

  const isActive = (to: (typeof links)[number]['to']) => {
    if (location.pathname !== '/') return false;
    if (to === '/') return !location.hash;
    return location.hash === new URL(to, window.location.origin).hash;
  };

  const closeDrawer = () => setOpen(false);
  const closeDrawerAfterNavigation = () => {
    setOpen(false);
    window.requestAnimationFrame(() => document.getElementById('main-content')?.focus({ preventScroll: true }));
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-line bg-white/90 backdrop-blur-xl">
        <div className="pattern-band h-1 w-full" aria-hidden="true" />
        <div className="mx-auto flex h-[4.5rem] w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Logo />

          <nav aria-label={t('nav.catalog')} className="hidden items-center gap-1 lg:flex">
            {links.map((link) => {
              const active = isActive(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  aria-current={active ? 'page' : undefined}
                    className={`relative inline-flex h-11 items-center rounded-full px-4 text-sm font-medium transition-all duration-200 ${
                    active
                      ? 'bg-brand text-content-inverse'
                      : 'text-content-muted hover:bg-surface-subtle hover:text-content-strong'
                  }`}
                >
                  {t(link.key)}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="hidden md:block">
              <LanguageSwitcher />
            </div>

            {initializing ? (
              <span className="hidden h-11 w-24 animate-pulse rounded-full bg-surface-subtle sm:block" aria-hidden="true" />
            ) : user ? (
              <Link
                to="/admin"
                className="group inline-flex h-11 items-center gap-2 rounded-full bg-brand px-2.5 text-[13px] font-semibold text-white transition-all hover:bg-brand-hover hover:-translate-y-px sm:px-3.5"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white/10 text-[11px] font-bold">
                  {initials(user)}
                </span>
                <span className="hidden sm:inline">{t('nav.admin')}</span>
                <LayoutDashboardIcon className="hidden h-4 w-4 sm:block" aria-hidden="true" />
              </Link>
            ) : (
              <Link
                to="/login"
                className="hidden h-11 items-center gap-2 rounded-full bg-brand px-4 text-sm font-semibold text-white transition-all hover:bg-brand-hover hover:-translate-y-px sm:inline-flex"
              >
                <LogInIcon className="h-4 w-4" aria-hidden="true" />
                {t('action.login')}
              </Link>
            )}

            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setOpen(true)}
              aria-label={t('a11y.openMenu', 'Menyuni ochish')}
              aria-expanded={open}
              aria-controls="public-mobile-menu"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line text-content transition-colors hover:bg-surface-subtle lg:hidden"
            >
              <MenuIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-[70] lg:hidden ${open ? 'visible' : 'invisible pointer-events-none'}`}
        aria-hidden={!open}
      >
        <button
          type="button"
          aria-label={t('action.close')}
          onClick={() => {
            closeDrawer();
            window.requestAnimationFrame(() => menuButtonRef.current?.focus());
          }}
          className={`absolute inset-0 h-full w-full bg-brand/60 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'}`}
        />

        <aside
          id="public-mobile-menu"
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={drawerTitleId}
            className={`absolute inset-y-0 right-0 flex w-[min(22rem,calc(100%-1rem))] flex-col bg-brand text-content-inverse shadow-pop transition-transform duration-300 ease-out motion-reduce:transition-none ${
            open ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="pattern-band h-1 w-full shrink-0" aria-hidden="true" />
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3.5">
            <div id={drawerTitleId} className="min-w-0">
              <Logo />
            </div>
            <button
              type="button"
              onClick={() => {
                closeDrawer();
                window.requestAnimationFrame(() => menuButtonRef.current?.focus());
              }}
              aria-label={t('action.close')}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            >
              <XIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <nav aria-label={t('nav.catalog')} className="flex-1 overflow-y-auto px-4 py-5">
            <ul className="space-y-1.5">
              {links.map((link) => {
                const active = isActive(link.to);
                return (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      onClick={closeDrawerAfterNavigation}
                      aria-current={active ? 'page' : undefined}
                      className={`flex min-h-12 items-center justify-between rounded-xl px-4 py-3 text-[15px] font-semibold transition-colors ${
                        active ? 'bg-white/10 text-accent' : 'text-white/75 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {t(link.key)}
                      <ArrowRightIcon className="h-4 w-4 opacity-60 rtl:rotate-180" aria-hidden="true" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="border-t border-white/10 bg-black/10 px-4 py-4">
            <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-white/45">{t('field.language')}</p>
            <LanguageSwitcher />
            {!initializing && (
              user ? (
                <Link
                  to="/admin"
                  onClick={closeDrawerAfterNavigation}
                  className="mt-4 flex min-h-12 items-center justify-between rounded-xl bg-navy-900 px-4 py-3 text-sm font-semibold text-white"
                >
                  <span className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white/10 text-[11px] font-bold">
                      {initials(user)}
                    </span>
                    {t('nav.admin')}
                  </span>
                  <LayoutDashboardIcon className="h-4 w-4" aria-hidden="true" />
                </Link>
              ) : (
                <Link
                  to="/login"
                  onClick={closeDrawerAfterNavigation}
                  className="mt-4 flex min-h-12 items-center justify-center gap-2 rounded-full bg-accent px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
                >
                  <LogInIcon className="h-4 w-4" aria-hidden="true" />
                  {t('action.login')}
                </Link>
              )
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
