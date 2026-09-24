import { ArrowLeftIcon, Building2Icon } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { FunctionCard } from '../components/catalog/FunctionCard';
import { Badge } from '../components/ui/Badge';
import { SkeletonCards, SkeletonText } from '../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../components/ui/States';
import { useAsync } from '../hooks/useAsync';
import { useI18n } from '../contexts/i18n';
import { getPublicOrganization } from '../services/organizationService';
import { getFunctions } from '../services/functionService';
import { localizedText } from '../utils/translations';

export function OrganizationDetail() {
  const { id } = useParams<{ id: string }>();
  const organizationId = Number(id);
  const { t, locale } = useI18n();

  const organization = useAsync(() => getPublicOrganization(organizationId), [organizationId]);
  const functions = useAsync(() => getFunctions({ organizationId }), [organizationId]);
  const organizationName = localizedText(organization.data?.name, organization.data?.nameTranslations, locale);
  const organizationDescription = localizedText(
    organization.data?.description,
    organization.data?.descriptionTranslations,
    locale
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
      <Link
        to="/#organizations"
        className="inline-flex min-h-11 items-center gap-2 rounded-full pr-3 text-sm font-semibold text-content-muted transition-colors hover:text-content-strong"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white shadow-card">
          <ArrowLeftIcon className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
        </span>
        {t('nav.organizations')}
      </Link>

      <section className="mt-5 overflow-hidden rounded-card border border-line bg-white shadow-card">
        {organization.loading ? (
          <div className="p-6 sm:p-9"><SkeletonText lines={4} /></div>
        ) : organization.error ? (
          <ErrorState error={organization.error} onRetry={organization.reload} />
        ) : organization.data ? (
          <div className="relative p-6 sm:p-9">
            <div className="absolute inset-x-0 top-0 h-1 bg-accent" aria-hidden="true" />
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 items-start gap-4 sm:gap-5">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-navy-100 bg-navy-50 text-navy-700 sm:h-14 sm:w-14">
                  <Building2Icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <div className="min-w-0 pt-0.5">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-accent">{t('field.organization')}</p>
                  <h1 className="mt-2 break-words font-display text-3xl font-extrabold leading-tight tracking-tight text-content-strong sm:text-4xl">
                    {organizationName}
                  </h1>
                </div>
              </div>
              <Badge tone="green" className="w-fit shrink-0">{t('status.active')}</Badge>
            </div>
            <div className="mt-7 border-t border-line pt-6">
              <p className="max-w-3xl break-words text-[15px] leading-7 text-navy-600">
                {organizationDescription ?? '—'}
              </p>
            </div>
          </div>
        ) : null}
      </section>

      <section className="mt-12">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-teal-700">{t('nav.functions')}</p>
            <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-navy-950">
              {t('org.functionsTitle')}
            </h2>
          </div>
          {!functions.loading && !functions.error && (
            <p className="text-sm font-medium text-navy-400" aria-live="polite">
              {(functions.data ?? []).length} {t('home.resultsCount')}
            </p>
          )}
        </div>

        <div className="mt-6">
          {functions.loading ? (
            <SkeletonCards count={3} />
          ) : functions.error ? (
            <div className="overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-card">
              <ErrorState error={functions.error} onRetry={functions.reload} />
            </div>
          ) : (functions.data ?? []).length === 0 ? (
            <div className="overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-card">
              <EmptyState title={t('state.emptyTitle')} description={t('org.emptyFunctions')} />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {(functions.data ?? []).map((item) => (
                <FunctionCard key={item.id} item={item} organizationName={organizationName ?? undefined} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
