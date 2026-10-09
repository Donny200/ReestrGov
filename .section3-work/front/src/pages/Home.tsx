import React, { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightIcon, ShieldCheckIcon } from 'lucide-react';
import { Hero } from '../components/home/Hero';
import { OrganizationCard } from '../components/catalog/OrganizationCard';
import { FunctionCard } from '../components/catalog/FunctionCard';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Field';
import { SkeletonCards } from '../components/ui/Skeleton';
import { ErrorState, NoResultsState } from '../components/ui/States';
import { useAsync } from '../hooks/useAsync';
import { useI18n } from '../contexts/I18nContext';
import { getPublicOrganizations } from '../services/organizationService';
import { getFunctions } from '../services/functionService';
import { getLanguages, getRegions } from '../services/referenceService';
import { localizedText } from '../utils/translations';

const CTA_IMAGE = "/e4e819e5-8e62-4727-b11f-3efa5076caaa.jpg";

export function Home() {
  const { t, locale } = useI18n();
  const [query, setQuery] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const [category, setCategory] = useState('');
  const [regionId, setRegionId] = useState('');
  const catalogRef = useRef<HTMLDivElement>(null);

  const organizations = useAsync(getPublicOrganizations, []);
  const functions = useAsync(() => getFunctions(), []);
  const regions = useAsync(getRegions, []);
  const languages = useAsync(getLanguages, []);

  const orgList = organizations.data ?? [];
  const fnList = functions.data ?? [];

  const orgName = useMemo(() => {
    const map = new Map<number, string>();
    orgList.forEach((item) => map.set(item.id, localizedText(item.name, item.nameTranslations, locale) ?? item.name));
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
        (orgName.get(item.organizationId) ?? '').toLowerCase().includes(term));

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
        onSubmit={() => catalogRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
        regions={regions.data ?? []}
        regionId={regionId}
        onRegionChange={setRegionId}
        languages={languages.data ?? []}
        stats={{
          organizations: orgList.length,
          functions: fnList.length,
          regions: (regions.data ?? []).length
        }} />
      

      {/* Catalogue + filters */}
      <section id="functions" ref={catalogRef} className="mx-auto w-full max-w-7xl scroll-mt-20 px-4 py-14 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-extrabold tracking-tight text-navy-900">{t('home.catalogTitle')}</h2>
            <p className="mt-1 text-sm text-navy-500">{t('home.catalogSubtitle')}</p>
          </div>
          <p className="text-[13px] font-medium text-navy-400">
            {filtered.length} {t('home.resultsCount')}
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3 rounded-xl border border-navy-100 bg-white p-4 shadow-card sm:flex-row sm:items-center">
          <label className="flex-1">
            <span className="sr-only">{t('action.search')}</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('home.heroSearchPlaceholder')}
              className="h-11 w-full rounded-lg border border-navy-200 px-3 text-sm text-navy-900 placeholder:text-navy-300 hover:border-navy-300" />
            
          </label>
          <label className="sm:w-56">
            <span className="sr-only">{t('field.organization')}</span>
            <Select value={organizationId} onChange={(event) => setOrganizationId(event.target.value)}>
              <option value="">{t('field.organization')} — {t('status.all')}</option>
              {orgList.map((item) =>
              <option key={item.id} value={String(item.id)}>
                  {localizedText(item.name, item.nameTranslations, locale)}
                </option>
              )}
            </Select>
          </label>
          <label className="sm:w-52">
            <span className="sr-only">{t('field.category')}</span>
            <Select value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="">{t('field.category')} — {t('status.all')}</option>
              {categories.map((item) =>
              <option key={item} value={item}>
                  {item}
                </option>
              )}
            </Select>
          </label>
          {hasFilters &&
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQuery('');
              setOrganizationId('');
              setCategory('');
            }}>
            
              {t('action.reset')}
            </Button>
          }
        </div>

        <div className="mt-6">
          {functions.loading ?
          <SkeletonCards count={6} /> :
          functions.error ?
          <div className="rounded-xl border border-navy-100 bg-white shadow-card">
              <ErrorState error={functions.error} onRetry={functions.reload} />
            </div> :
          filtered.length === 0 ?
          <div className="rounded-xl border border-navy-100 bg-white shadow-card">
              <NoResultsState title={t('state.emptyTitle')} description={t('state.emptyText')} />
            </div> :

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((item) =>
            <FunctionCard key={item.id} item={item} organizationName={orgName.get(item.organizationId)} />
            )}
            </div>
          }
        </div>
      </section>

      {/* Organizations */}
      <section id="organizations" className="border-t border-navy-100 bg-white/60 py-14">
        <div className="mx-auto w-full max-w-7xl scroll-mt-20 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display text-2xl font-extrabold tracking-tight text-navy-900">{t('home.orgsTitle')}</h2>
              <p className="mt-1 text-sm text-navy-500">{t('home.orgsSubtitle')}</p>
            </div>
          </div>

          <div className="mt-6">
            {organizations.loading ?
            <SkeletonCards count={6} /> :
            organizations.error ?
            <div className="rounded-xl border border-navy-100 bg-white shadow-card">
                <ErrorState error={organizations.error} onRetry={organizations.reload} />
              </div> :
            orgList.length === 0 ?
            <div className="rounded-xl border border-navy-100 bg-white shadow-card">
                <NoResultsState title={t('state.emptyTitle')} />
              </div> :

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {orgList.map((item) =>
              <OrganizationCard
                key={item.id}
                organization={item}
                functionCount={functionCountByOrg.get(item.id) ?? 0} />

              )}
              </div>
            }
          </div>
        </div>
      </section>

      {/* Staff CTA */}
      <section className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid overflow-hidden rounded-2xl border border-navy-100 bg-navy-900 shadow-card lg:grid-cols-2">
          <div className="p-8 sm:p-10">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[12px] font-medium text-teal-200">
              <ShieldCheckIcon className="h-3.5 w-3.5" aria-hidden="true" />
              {t('nav.admin')}
            </span>
            <h2 className="mt-4 font-display text-2xl font-extrabold tracking-tight text-white">{t('home.ctaTitle')}</h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-navy-200">{t('home.ctaText')}</p>
            <Link to="/login" className="mt-6 inline-block">
              <Button variant="secondary" icon={<ArrowRightIcon className="h-4 w-4" />}>
                {t('action.login')}
              </Button>
            </Link>
          </div>
          <div className="relative min-h-[220px]">
            <img src={CTA_IMAGE} alt="Davlat xizmatlari markazi zali" className="h-full w-full object-cover" />
          </div>
        </div>
      </section>
    </div>);

}
