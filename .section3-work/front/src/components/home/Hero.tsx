import React from 'react';
import { SearchIcon } from 'lucide-react';
import { Button } from '../ui/Button';
import { Select } from '../ui/Field';
import { useI18n } from '../../contexts/I18nContext';
import type { Language, Region } from '../../types/api';

const HERO_IMAGE = "/3e42b6c2-ea58-46c4-a3f2-45342d80cb5b.jpg";

interface HeroProps {
  query: string;
  onQueryChange: (value: string) => void;
  onSubmit: () => void;
  regions: Region[];
  regionId: string;
  onRegionChange: (value: string) => void;
  languages: Language[];
  stats: {organizations: number;functions: number;regions: number;};
}

export function Hero({
  query,
  onQueryChange,
  onSubmit,
  regions,
  regionId,
  onRegionChange,
  languages,
  stats
}: HeroProps) {
  const { t, locale, setLocale } = useI18n();

  return (
    <section className="relative isolate overflow-hidden bg-navy-900">
      <img
        src={HERO_IMAGE}
        alt="Zamonaviy davlat idorasi binosi va oldidagi maydon"
        className="absolute inset-0 h-full w-full object-cover opacity-30" />
      
      <div className="absolute inset-0 bg-navy-950/70" aria-hidden="true" />

      <div className="relative mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[12px] font-medium text-teal-200 ring-1 ring-inset ring-white/15">
          <span className="h-1.5 w-1.5 rounded-full bg-flag-green" />
          {t('home.heroBadge')}
        </span>

        <h1 className="mt-5 max-w-3xl font-display text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
          {t('home.heroTitle')}
        </h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-navy-200 sm:text-base">{t('home.heroSubtitle')}</p>

        <form
          className="mt-8 flex w-full max-w-3xl flex-col gap-2 rounded-xl bg-white/95 p-2 shadow-pop sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
          role="search">
          
          <label className="flex flex-1 items-center gap-2 px-3">
            <SearchIcon className="h-4 w-4 shrink-0 text-navy-400" aria-hidden="true" />
            <span className="sr-only">{t('action.search')}</span>
            <input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder={t('home.heroSearchPlaceholder')}
              className="h-11 w-full border-0 bg-transparent text-sm text-navy-900 placeholder:text-navy-400 focus:outline-none" />
            
          </label>
          <Button type="submit" variant="secondary" size="md" className="sm:w-36">
            {t('action.search')}
          </Button>
        </form>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="flex items-center gap-2 text-[13px] text-navy-200">
            <span className="whitespace-nowrap">{t('field.region')}</span>
            <Select
              value={regionId}
              onChange={(event) => onRegionChange(event.target.value)}
              className="h-10 w-48 border-white/20 bg-white/10 text-white">
              
              <option value="" className="text-navy-900">
                {t('status.all')}
              </option>
              {regions.map((region) =>
              <option key={region.id} value={String(region.id)} className="text-navy-900">
                  {region.name}
                </option>
              )}
            </Select>
          </label>
          <label className="flex items-center gap-2 text-[13px] text-navy-200">
            <span className="whitespace-nowrap">{t('field.language')}</span>
            <Select
              value={locale}
              onChange={(event) => setLocale(event.target.value)}
              className="h-10 w-40 border-white/20 bg-white/10 text-white">
              
              {languages.map((language) =>
              <option key={language.id} value={language.code} className="text-navy-900">
                  {language.nativeName}
                </option>
              )}
            </Select>
          </label>
        </div>

        <dl className="mt-10 grid max-w-2xl grid-cols-3 gap-4 border-t border-white/10 pt-6">
          {[
          { label: t('home.statsOrganizations'), value: stats.organizations },
          { label: t('home.statsFunctions'), value: stats.functions },
          { label: t('home.statsRegions'), value: stats.regions }].
          map((stat) =>
          <div key={stat.label}>
              <dt className="text-[12px] text-navy-300">{stat.label}</dt>
              <dd className="mt-1 font-display text-2xl font-extrabold text-white sm:text-3xl">{stat.value}</dd>
            </div>
          )}
        </dl>
      </div>
    </section>);

}
