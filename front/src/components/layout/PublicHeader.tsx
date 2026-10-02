import { useEffect, useId, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRightIcon, LayoutDashboardIcon, LogInIcon, MenuIcon, XIcon } from 'lucide-react';
import { cn } from '../../lib/cn';
import { Logo } from './Logo';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeToggle } from '../ui/ThemeToggle';
import { Button } from '../ui/Button';
import { buttonVariants } from '../ui/buttonVariants';
import { Avatar } from '../ui/Avatar';
import { useAuth } from '../../contexts/auth';
import { useI18n } from '../../contexts/i18n';

const links = [
  { to: '/', key: 'nav.home' },
  { to: '/#organizations', key: 'nav.organizations' },
  { to: '/#functions', key: 'nav.functions' },
] as const;

const FOCUSABLE = 'a[href], button:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function PublicHeader() {
  const { t } = useI18n();
  const { user, initializing } = useAuth();
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
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
      drawerRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    });
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        window.requestAnimationFrame(() => menuButtonRef.current?.focus());
        return;
      }
      if (event.key !== 'Tab' || !drawerRef.current) return;
      const focusable = Array.from(drawerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
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

  const closeDrawer = () => {
    setOpen(false);
    window.requestAnimationFrame(() => menuButtonRef.current?.focus());
  };

  const closeAfterNavigation = () => {
    setOpen(false);
    window.requestAnimationFrame(() => document.getElementById('main-content')?.focus({ preventScroll: true }));
  };

  return (
    <>
      <header className="glass sticky top-0 z-50 border-x-0 border-t-0">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Logo />

          <nav aria-label={t('nav.catalog')} className="hidden items-center gap-1 lg:flex">
            {links.map((link) => {
              const active = isActive(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'press inline-flex h-9 items-center rounded-control px-3.5 text-sm font-medium transition-colors duration-fast',
                    active ? 'bg-brand-subtle text-link' : 'text-content-muted hover:bg-surface-subtle hover:text-content-strong',
                  )}
                >
                  {t(link.key)}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <ThemeToggle />
            <LanguageSwitcher compact className="hidden md:inline-flex" />
            {initializing ? (
              <span className="hidden h-10 w-28 animate-pulse rounded-control bg-surface-subtle sm:block" aria-hidden="true" />
            ) : user ? (
              <Link to="/admin" className={cn(buttonVariants({ variant: 'outline' }), 'hidden pl-1.5 sm:inline-flex')}>
                <Avatar user={user} size="sm" />
                {t('nav.admin')}
                <LayoutDashboardIcon aria-hidden="true" />
              </Link>
            ) : (
              <Link to="/login" className={cn(buttonVariants({ variant: 'primary' }), 'hidden sm:inline-flex')}>
                <LogInIcon aria-hidden="true" />
                {t('action.login')}
              </Link>
            )}
            <Button
              ref={menuButtonRef}
              variant="outline"
              size="icon"
              className="lg:hidden"
              onClick={() => setOpen(true)}
              aria-label={t('a11y.openMenu', 'Open menu')}
              aria-expanded={open}
              aria-controls="public-mobile-menu"
            >
              <MenuIcon aria-hidden="true" />
            </Button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[70] lg:hidden">
            <motion.button
              type="button"
              tabIndex={-1}
              aria-label={t('action.close')}
              onClick={closeDrawer}
              className="absolute inset-0 h-full w-full cursor-default bg-black/50 backdrop-blur-sm"
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0 }}
              transition={{ duration: 0.18 }}
            />
            <motion.div
              ref={drawerRef}
              id="public-mobile-menu"
              role="dialog"
              aria-modal="true"
              aria-labelledby={drawerTitleId}
              className="glass-strong absolute inset-y-0 right-0 flex w-[min(22rem,calc(100%-1rem))] flex-col shadow-overlay"
              initial={reduceMotion ? false : { x: 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={reduceMotion ? undefined : { x: 40, opacity: 0 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex h-16 items-center justify-between border-b border-line/80 px-4">
                <div id={drawerTitleId} className="min-w-0">
                  <Logo />
                </div>
                <Button variant="ghost" size="iconSm" onClick={closeDrawer} aria-label={t('action.close')}>
                  <XIcon aria-hidden="true" />
                </Button>
              </div>

              <nav aria-label={t('nav.catalog')} className="flex-1 overflow-y-auto px-3 py-4">
                <ul className="space-y-1">
                  {links.map((link) => {
                    const active = isActive(link.to);
                    return (
                      <li key={link.to}>
                        <Link
                          to={link.to}
                          onClick={closeAfterNavigation}
                          aria-current={active ? 'page' : undefined}
                          className={cn(
                            'flex min-h-12 items-center justify-between rounded-control px-3.5 text-[15px] font-medium transition-colors duration-fast',
                            active ? 'bg-brand-subtle text-link' : 'text-content hover:bg-surface-subtle hover:text-content-strong',
                          )}
                        >
                          {t(link.key)}
                          <ArrowRightIcon className="h-4 w-4 opacity-60 rtl:rotate-180" aria-hidden="true" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              <div className="space-y-3 border-t border-line/80 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-content-muted">{t('field.language')}</p>
                <LanguageSwitcher className="w-full [&>select]:w-full [&>select]:max-w-none" />
                {!initializing &&
                  (user ? (
                    <Link
                      to="/admin"
                      onClick={closeAfterNavigation}
                      className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'w-full justify-between')}
                    >
                      <span className="flex items-center gap-2.5">
                        <Avatar user={user} size="sm" />
                        {t('nav.admin')}
                      </span>
                      <LayoutDashboardIcon aria-hidden="true" />
                    </Link>
                  ) : (
                    <Link
                      to="/login"
                      onClick={closeAfterNavigation}
                      className={cn(buttonVariants({ variant: 'gradient', size: 'lg' }), 'w-full')}
                    >
                      <LogInIcon aria-hidden="true" />
                      {t('action.login')}
                    </Link>
                  ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
