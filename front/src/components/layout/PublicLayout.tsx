import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useI18n } from '../../contexts/i18n';
import { PublicHeader } from './PublicHeader';
import { PublicFooter } from './PublicFooter';

export function PublicLayout() {
  const location = useLocation();
  const { t } = useI18n();

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      if (location.hash) {
        let targetId = location.hash.slice(1);
        try {
          targetId = decodeURIComponent(targetId);
        } catch {
          targetId = '';
        }
        const target = targetId ? document.getElementById(targetId) : null;
        if (target) {
          target.scrollIntoView({
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
            block: 'start'
          });
          target.focus({ preventScroll: true });
          return;
        }
      }

      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      document.getElementById('main-content')?.focus({ preventScroll: true });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [location.hash, location.pathname]);

  return (
    <div className="flex min-h-screen min-h-dvh w-full flex-col bg-canvas text-content">
      <a
        href="#main-content"
        className="fixed left-4 top-3 z-[80] -translate-y-20 rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-pop transition-transform focus:translate-y-0"
      >
        {t('a11y.skipToContent', "Asosiy tarkibga o'tish")}
      </a>
      <PublicHeader />
      <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}
