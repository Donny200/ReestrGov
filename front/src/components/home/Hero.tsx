import { SearchIcon } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAnimatedNumber } from '../../hooks/useAnimatedNumber';
import { useI18n } from '../../contexts/i18n';

export interface HeroStats {
  organizations: number | null;
  functions: number | null;
  regions: number | null;
}

interface HeroProps {
  query: string;
  onQueryChange: (value: string) => void;
  onSubmit: () => void;
  stats: HeroStats;
}

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

function StatValue({ value }: { value: number | null }) {
  const { t } = useI18n();
  const animated = useAnimatedNumber(value ?? 0);
  if (value === null) return <span aria-label={t('state.loading')}>—</span>;
  return <>{animated}</>;
}

export function Hero({ query, onQueryChange, onSubmit, stats }: HeroProps) {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();
  const items = [
    { label: t('home.statsOrganizations'), value: stats.organizations },
    { label: t('home.statsFunctions'), value: stats.functions },
    { label: t('home.statsRegions'), value: stats.regions },
  ];
  const reveal = (delay: number) => ({
    initial: reduceMotion ? false : { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.55, ease: EASE, delay },
  });

  return (
    <section className="relative isolate overflow-hidden border-b border-line/80">
      <div
        className="grid-pattern pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black_35%,transparent_100%)]"
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[32rem] w-[56rem] -translate-x-1/2 rounded-full bg-brand/15 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-32 right-[-10rem] h-[24rem] w-[24rem] rounded-full bg-accent/10 blur-3xl" aria-hidden="true" />

      <div className="relative mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <motion.span
            {...reveal(0)}
            className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/80 px-3 py-1 text-xs font-medium text-content-muted shadow-xs backdrop-blur"
          >
            <span className="h-2 w-2 rounded-full bg-positive animate-pulse-ring" aria-hidden="true" />
            {t('home.heroBadge')}
          </motion.span>

          <motion.h1
            {...reveal(0.05)}
            className="mt-6 text-balance font-display text-4xl font-bold leading-[1.05] tracking-tight text-content-strong sm:text-5xl lg:text-6xl"
          >
            <span className="text-gradient">{t('home.heroTitle')}</span>
          </motion.h1>

          <motion.p {...reveal(0.1)} className="mx-auto mt-5 max-w-2xl text-base leading-7 text-content-muted sm:text-lg">
            {t('home.heroSubtitle')}
          </motion.p>

          <motion.form
            {...reveal(0.15)}
            role="search"
            onSubmit={(event) => {
              event.preventDefault();
              onSubmit();
            }}
            className="glass mx-auto mt-9 flex max-w-2xl flex-col gap-2 rounded-overlay p-2 shadow-elevated focus-within:ring-2 focus-within:ring-focus/30 sm:flex-row"
          >
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">{t('action.search')}</span>
              <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-content-subtle" aria-hidden="true" />
              <Input
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
                placeholder={t('home.heroSearchPlaceholder')}
                className="h-12 border-0 bg-transparent pl-12 shadow-none focus-visible:ring-0"
              />
            </label>
            <Button type="submit" size="lg" variant="gradient" className="sm:min-w-36">
              {t('action.search')}
            </Button>
          </motion.form>

          <motion.dl {...reveal(0.2)} className="mx-auto mt-12 grid max-w-2xl grid-cols-3 divide-x divide-line/80">
            {items.map((item) => (
              <div key={item.label} className="px-3 sm:px-6">
                <dd className="font-display text-2xl font-bold tabular-nums tracking-tight text-content-strong sm:text-3xl">
                  <StatValue value={item.value} />
                </dd>
                <dt className="mt-1 text-[11px] font-medium uppercase tracking-wide text-content-muted sm:text-xs">{item.label}</dt>
              </div>
            ))}
          </motion.dl>
        </div>
      </div>
    </section>
  );
}
