import { useMemo, useRef, useState } from 'react';
import { ArrowRightIcon, SearchIcon, ShieldCheckIcon, SlidersHorizontalIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Hero } from '../components/home/Hero';
import { OrganizationCard } from '../components/catalog/OrganizationCard';
import { FunctionCard } from '../components/catalog/FunctionCard';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Field';
import { SkeletonCards } from '../components/ui/Skeleton';
import { ErrorState, NoResultsState } from '../components/ui/States';
import { useAsync } from '../hooks/useAsync';
import { useI18n } from '../contexts/i18n';
import { getPublicOrganizations } from '../services/organizationService';
import { getFunctions } from '../services/functionService';
import { getLanguages, getRegions } from '../services/referenceService';
import { localizedText } from '../utils/translations';

const CTA_IMAGE = '/e4e819e5-8e62-4727-b11f-3efa5076caaa.jpg';

export function Home() {
  const { t, locale } = useI18n();
  const [query, setQuery] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const [category, setCategory] = useState('');
  const [regionId, setRegionId] = useState('');
  const catalogRef = useRef<HTMLElement>(null);

  const organizations = useAsync(getPublicOrganizations, []);
  const functions = useAsync(() => getFunctions(), []);
  const regions = useAsync(getRegions, []);
  const languages = useAsync(getLanguages, []);

  const orgList = useMemo(() => organizations.data ?? [], [organizations.data]);
  const fnList = useMemo(() => functions.data ?? [], [functions.data]);

  const orgName = useMemo(() => {
    const map = new Map<number, string>();
    orgList.forEach((item) => {
      map.set(item.id, localizedText(item.name, item.nameTranslations, locale) ?? item.name);
    });
    return map;
  }, [orgList, locale]);

  const categories = useMemo(
    () => Array.from(new Set(fnList.map((item) => item.category).filter(Boolean) as string[])).sort(),
    [fnList]
  );

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return fnList.filter((item) => {
      if (organizationId && item.organizationId !== Number(organizationId)) return false;
      if (category && item.category !== category) return false;
      if (!term) return true;
      return (
        (localizedText(item.name, item.nameTranslations, locale) ?? '').toLowerCase().includes(term) ||
        (localizedText(item.description, item.descriptionTranslations, locale) ?? '').toLowerCase().includes(term) ||
        (orgName.get(item.organizationId) ?? '').toLowerCase().includes(term)
      );
    });
  }, [fnList, organizationId, category, query, orgName, locale]);

  const functionCountByOrg = useMemo(() => {
    const map = new Map<number, number>();
    fnList.forEach((item) => map.set(item.organizationId, (map.get(item.organizationId) ?? 0) + 1));
    return map;
  }, [fnList]);

  const hasFilters = Boolean(query || organizationId || category);

  return (
    <div className="w-full">
      <Hero
        query={query}
        onQueryChange={setQuery}
        onSubmit={() => catalogRef.current?.scrollIntoView({
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
          block: 'start'
        })}
        regions={regions.data ?? []}
        regionId={regionId}
        onRegionChange={setRegionId}
        languages={languages.data ?? []}
        stats={{
          organizations: organizations.data ? orgList.length : null,
          functions: functions.data ? fnList.length : null,
          regions: regions.data ? regions.data.length : null
        }}
      />

      <section
        id="functions"
        ref={catalogRef}
        tabIndex={-1}
        className="mx-auto w-full max-w-7xl scroll-mt-24 px-4 py-14 focus:outline-none sm:px-6 sm:py-20 lg:px-8"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">{t('nav.catalog')}</p>
            <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-content-strong sm:text-4xl">
              {t('home.catalogTitle')}
            </h2>
            <p className="mt-2 text-sm leading-6 text-content-muted">{t('home.catalogSubtitle')}</p>
          </div>
          <p
            aria-live="polite"
            className="inline-flex min-h-9 w-fit items-center rounded-full border border-line bg-surface-subtle px-3 text-xs font-semibold text-content-muted"
          >
            {filtered.length} {t('home.resultsCount')}
          </p>
        </div>

        <div className="mt-7 rounded-surface border border-line bg-surface p-4 shadow-surface sm:p-5">
          <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-content-muted">
            <SlidersHorizontalIcon className="h-4 w-4" aria-hidden="true" />
            {t('action.search')}
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_14rem_13rem_auto] lg:items-end">
            <label className="min-w-0 md:col-span-2 lg:col-span-1">
              <span className="mb-1.5 block text-xs font-semibold text-content">{t('action.search')}</span>
              <span className="relative block">
                <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" aria-hidden="true" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t('home.heroSearchPlaceholder')}
                  className="h-11 w-full rounded-control border border-line bg-white pl-10 pr-3 text-sm text-content-strong placeholder:text-content-subtle transition-colors hover:border-line-strong focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/10"
                />
              </span>
            </label>

            <label className="min-w-0">
              <span className="mb-1.5 block text-xs font-semibold text-navy-600">{t('field.organization')}</span>
              <Select value={organizationId} onChange={(event) => setOrganizationId(event.target.value)}>
                <option value="">{t('status.all')}</option>
                {orgList.map((item) => (
                  <option key={item.id} value={String(item.id)}>
                    {localizedText(item.name, item.nameTranslations, locale)}
                  </option>
                ))}
              </Select>
            </label>

            <label className="min-w-0">
              <span className="mb-1.5 block text-xs font-semibold text-navy-600">{t('field.category')}</span>
              <Select value={category} onChange={(event) => setCategory(event.target.value)}>
                <option value="">{t('status.all')}</option>
                {categories.map((item) => <option key={item} value={item}>{item}</option>)}
              </Select>
            </label>

            <div className="flex items-end md:justify-end lg:justify-start">
              {hasFilters && (
                <Button
                  variant="ghost"
                  size="md"
                  className="w-full md:w-auto"
                  onClick={() => {
                    setQuery('');
                    setOrganizationId('');
                    setCategory('');
                  }}
                >
                  {t('action.reset')}
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-7">
          {functions.loading ? (
            <SkeletonCards count={6} />
          ) : functions.error ? (
            <div className="overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-card">
              <ErrorState error={functions.error} onRetry={functions.reload} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-card">
              <NoResultsState title={t('state.emptyTitle')} description={t('state.emptyText')} />
            </div>
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
        className="scroll-mt-24 border-y border-line bg-surface-subtle py-14 focus:outline-none sm:py-20"
      >
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">{t('nav.organizations')}</p>
            <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-content-strong sm:text-4xl">
              {t('home.orgsTitle')}
            </h2>
            <p className="mt-2 text-sm leading-6 text-content-muted">{t('home.orgsSubtitle')}</p>
          </div>

          <div className="mt-7">
            {organizations.loading ? (
              <SkeletonCards count={6} />
            ) : organizations.error ? (
              <div className="overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-card">
                <ErrorState error={organizations.error} onRetry={organizations.reload} />
              </div>
            ) : orgList.length === 0 ? (
              <div className="overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-card">
                <NoResultsState title={t('state.emptyTitle')} />
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {orgList.map((item) => (
                  <OrganizationCard
                    key={item.id}
                    organization={item}
                    functionCount={functionCountByOrg.get(item.id) ?? 0}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="grid overflow-hidden rounded-card border border-brand bg-brand shadow-pop lg:grid-cols-[minmax(0,1.05fr)_minmax(22rem,0.95fr)]">
          <div className="flex flex-col justify-center p-6 sm:p-10 lg:p-12">
            <span className="inline-flex min-h-8 w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 text-xs font-semibold text-white/75">
              <ShieldCheckIcon className="h-4 w-4" aria-hidden="true" />
              {t('nav.admin')}
            </span>
            <h2 className="mt-5 max-w-xl font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              {t('home.ctaTitle')}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/60">{t('home.ctaText')}</p>
            <Link
              to="/login"
              className="mt-7 inline-flex h-12 w-fit items-center justify-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
            >
              {t('action.login')}
              <ArrowRightIcon className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
            </Link>
          </div>
          <div className="relative min-h-56 border-t border-white/10 lg:min-h-[25rem] lg:border-l lg:border-t-0">
            <img
              src={CTA_IMAGE}
              alt={t('home.ctaImageAlt', 'Davlat xizmatlari markazi zali')}
              width={1264}
              height={848}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-navy-950/15" aria-hidden="true" />
          </div>
        </div>
      </section>
    </div>
  );
}
