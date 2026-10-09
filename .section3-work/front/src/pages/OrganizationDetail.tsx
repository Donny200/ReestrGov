import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeftIcon, BuildingIcon } from 'lucide-react';
import { FunctionCard } from '../components/catalog/FunctionCard';
import { Badge } from '../components/ui/Badge';
import { SkeletonCards, SkeletonText } from '../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../components/ui/States';
import { useAsync } from '../hooks/useAsync';
import { useI18n } from '../contexts/I18nContext';
import { getPublicOrganization } from '../services/organizationService';
import { getFunctions } from '../services/functionService';
import { localizedText } from '../utils/translations';

export function OrganizationDetail() {
  const { id } = useParams<{id: string;}>();
  const organizationId = Number(id);
  const { t, locale } = useI18n();

  const organization = useAsync(() => getPublicOrganization(organizationId), [organizationId]);
  const functions = useAsync(() => getFunctions({ organizationId }), [organizationId]);
  const organizationName = localizedText(organization.data?.name, organization.data?.nameTranslations, locale);
  const organizationDescription = localizedText(organization.data?.description, organization.data?.descriptionTranslations, locale);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <Link
        to="/#organizations"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-navy-500 transition-colors hover:text-navy-900">
        
        <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
        {t('nav.organizations')}
      </Link>

      <section className="mt-4 rounded-xl border border-navy-100 bg-white p-6 shadow-card sm:p-8">
        {organization.loading ?
        <SkeletonText lines={4} /> :
        organization.error ?
        <ErrorState error={organization.error} onRetry={organization.reload} /> :
        organization.data ?
        <>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-700">
                  <BuildingIcon className="h-6 w-6" aria-hidden="true" />
                </span>
                <div>
                  <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy-900">
                    {organizationName}
                  </h1>
                </div>
              </div>
              <Badge tone="green">{t('status.active')}</Badge>
            </div>
            <p className="mt-5 max-w-3xl text-[15px] leading-relaxed text-navy-600">
              {organizationDescription ?? '—'}
            </p>
          </> :
        null}
      </section>

      <section className="mt-8">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-lg font-bold text-navy-900">{t('org.functionsTitle')}</h2>
          {!functions.loading && !functions.error &&
          <p className="text-[13px] text-navy-400">
              {(functions.data ?? []).length} {t('home.resultsCount')}
            </p>
          }
        </div>

        <div className="mt-4">
          {functions.loading ?
          <SkeletonCards count={3} /> :
          functions.error ?
          <div className="rounded-xl border border-navy-100 bg-white shadow-card">
              <ErrorState error={functions.error} onRetry={functions.reload} />
            </div> :
          (functions.data ?? []).length === 0 ?
          <div className="rounded-xl border border-navy-100 bg-white shadow-card">
              <EmptyState title={t('state.emptyTitle')} description={t('org.emptyFunctions')} />
            </div> :

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(functions.data ?? []).map((item) =>
            <FunctionCard key={item.id} item={item} organizationName={organizationName ?? undefined} />
            )}
            </div>
          }
        </div>
      </section>
    </div>);

}
