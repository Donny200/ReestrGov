import { useMemo, useRef, useState } from 'react';
import { ArrowRightIcon, RotateCcwIcon, ShieldCheckIcon, SlidersHorizontalIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Hero } from '../components/home/Hero';
import { SectionHeading } from '../components/home/SectionHeading';
import { OrganizationCard } from '../components/catalog/OrganizationCard';
import { FunctionCard } from '../components/catalog/FunctionCard';
import { Button } from '../components/ui/Button';
import { buttonVariants } from '../components/ui/buttonVariants';
import { Card } from '../components/ui/Card';
import { Select } from '../components/ui/Input';
import { SearchInput } from '../components/ui/SearchInput';
import { SkeletonCards } from '../components/ui/Skeleton';
import { ErrorState, NoResultsState } from '../components/ui/States';
import { useI18n } from '../contexts/i18n';
import { usePublicOrganizations } from '../features/organizations/queries';
import { usePublicFunctions } from '../features/functions/queries';
import { useRegions } from '../features/reference/queries';
import { cn } from '../lib/cn';
import { localizedText } from '../utils/translations';

const CTA_IMAGE = '/e4e819e5-8e62-4727-b11f-3efa5076caaa.jpg';

export function Home() {
  const { t, locale } = useI18n();
  const [query, setQuery] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const [category, setCategory] = useState('');
  const catalogRef = useRef<HTMLElement>(null);

  const organizations = usePublicOrganizations();
  const functions = usePublicFunctions();
  const regions = useRegions();

  const orgList = useMemo(() => organizations.data ?? [], [organizations.data]);
  const fnList = useMemo(() => functions.data ?? [], [functions.data]);

  const orgName = useMemo(() => {
    const map = new Map<number, string>();
    orgList.forEach((item) => map.set(item.id, localizedText(item.name, item.nameTranslations, locale) ?? item.name));
    return map;
  }, [orgList, locale]);

  const categories = useMemo(
    () => Array.from(new Set(fnList.map((item) => item.category).filter((value): value is string => Boolean(value)))).sort(),
    [fnList],
  );

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return fnList.filter((item) => {
      if (organizationId && item.organizationId !== Number(organizationId)) return false;
      if (category && item.category !== category) return false;
      if (!term) return true;
      return [
        localizedText(item.name, item.nameTranslations, locale),
        localizedText(item.description, item.descriptionTranslations, locale),
        orgName.get(item.organizationId),
      ].some((value) => (value ?? '').toLowerCase().includes(term));
    });
  }, [fnList, organizationId, category, query, orgName, locale]);

  const functionCountByOrg = useMemo(() => {
    const map = new Map<number, number>();
    fnList.forEach((item) => map.set(item.organizationId, (map.get(item.organizationId) ?? 0) + 1));
    return map;
  }, [fnList]);

  const hasFilters = Boolean(query || organizationId || category);

  const scrollToCatalog = () =>
    catalogRef.current?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start',
    });

  const resetFilters = () => {
    setQuery('');
    setOrganizationId('');
    setCategory('');
  };

  return (
    <div className="w-full animate-fade-up">
      <Hero
        query={query}
        onQueryChange={setQuery}
        onSubmit={scrollToCatalog}
        stats={{
          organizations: organizations.data ? orgList.length : null,
          functions: functions.data ? fnList.length : null,
          regions: regions.data ? regions.data.length : null,
        }}
      />

      <section
        id="functions"
        ref={catalogRef}
        tabIndex={-1}
        className="mx-auto w-full max-w-7xl scroll-mt-24 px-4 py-14 focus:outline-none sm:px-6 sm:py-20 lg:px-8"
      >
        <SectionHeading
          eyebrow={t('nav.catalog')}
          title={t('home.catalogTitle')}
          description={t('home.catalogSubtitle')}
          aside={
            <p
              aria-live="polite"
              className="inline-flex h-9 w-fit items-center rounded-full border border-line bg-surface/80 px-3 text-xs font-semibold tabular-nums text-content-muted shadow-xs"
            >
              {filtered.length} {t('home.resultsCount')}
            </p>
          }
        />

        <div className="glass sticky top-20 z-20 mt-7 rounded-surface p-3 shadow-surface sm:p-4">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-content-muted">
            <SlidersHorizontalIcon className="h-4 w-4" aria-hidden="true" />
            {t('action.search')}
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_14rem_13rem_auto] lg:items-center">
            <SearchInput
              value={query}
              onChange={setQuery}
              label={t('action.search')}
              placeholder={t('home.heroSearchPlaceholder')}
              className="md:col-span-2 lg:col-span-1"
            />
            <label className="min-w-0">
              <span className="sr-only">{t('field.organization')}</span>
              <Select value={organizationId} onChange={(event) => setOrganizationId(event.target.value)}>
                <option value="">{t('field.organization')} · {t('status.all')}</option>
                {orgList.map((item) => (
                  <option key={item.id} value={String(item.id)}>
                    {localizedText(item.name, item.nameTranslations, locale)}
                  </option>
                ))}
              </Select>
            </label>
            <label className="min-w-0">
              <span className="sr-only">{t('field.category')}</span>
              <Select value={category} onChange={(event) => setCategory(event.target.value)}>
                <option value="">{t('field.category')} · {t('status.all')}</option>
                {categories.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </Select>
            </label>
            <div className="flex md:justify-end lg:justify-start">
              {hasFilters && (
                <Button variant="ghost" className="w-full md:w-auto" icon={<RotateCcwIcon />} onClick={resetFilters}>
                  {t('action.reset')}
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-7">
          {functions.isPending ? (
            <SkeletonCards count={6} />
          ) : functions.error ? (
            <Card><ErrorState error={functions.error} onRetry={() => void functions.refetch()} /></Card>
          ) : filtered.length === 0 ? (
            <Card><NoResultsState title={t('state.emptyTitle')} description={t('state.emptyText')} /></Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((item) => (
                <FunctionCard key={item.id} item={item} organizationName={orgName.get(item.organizationId)} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section
        id="organizations"
        tabIndex={-1}
        className="scroll-mt-24 border-y border-line/80 bg-surface/60 py-14 focus:outline-none sm:py-20"
      >
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow={t('nav.organizations')} title={t('home.orgsTitle')} description={t('home.orgsSubtitle')} />
          <div className="mt-7">
            {organizations.isPending ? (
              <SkeletonCards count={6} />
            ) : organizations.error ? (
              <Card><ErrorState error={organizations.error} onRetry={() => void organizations.refetch()} /></Card>
            ) : orgList.length === 0 ? (
              <Card><NoResultsState title={t('state.emptyTitle')} /></Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {orgList.map((item) => (
                  <OrganizationCard key={item.id} organization={item} functionCount={functionCountByOrg.get(item.id) ?? 0} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="grid overflow-hidden rounded-card bg-brand-gradient shadow-pop lg:grid-cols-[minmax(0,1.05fr)_minmax(22rem,0.95fr)]">
          <div className="flex flex-col justify-center p-6 text-white sm:p-10 lg:p-12">
            <span className="inline-flex h-8 w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 text-xs font-semibold backdrop-blur">
              <ShieldCheckIcon className="h-4 w-4" aria-hidden="true" />
              {t('nav.admin')}
            </span>
            <h2 className="mt-5 max-w-xl font-display text-2xl font-bold tracking-tight sm:text-3xl">{t('home.ctaTitle')}</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/80">{t('home.ctaText')}</p>
            <Link
              to="/login"
              className={cn(
                buttonVariants({ size: 'lg' }),
                'mt-7 w-fit bg-surface text-content-strong shadow-elevated hover:bg-surface-subtle hover:shadow-elevated',
              )}
            >
              {t('action.login')}
              <ArrowRightIcon className="rtl:rotate-180" aria-hidden="true" />
            </Link>
          </div>
          <div className="relative min-h-56 lg:min-h-[25rem]">
            <img
              src={CTA_IMAGE}
              alt={t('home.ctaImageAlt', 'Public services centre hall')}
              width={1264}
              height={848}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-brand/40 to-transparent" aria-hidden="true" />
          </div>
        </div>
      </section>
    </div>
  );
}
