import { Building2Icon } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { BackLink } from '../components/catalog/BackLink';
import { FunctionCard } from '../components/catalog/FunctionCard';
import { SectionHeading } from '../components/home/SectionHeading';
import { StatusPill } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { SkeletonCards, SkeletonText } from '../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../components/ui/States';
import { useI18n } from '../contexts/i18n';
import { usePublicOrganization } from '../features/organizations/queries';
import { usePublicFunctions } from '../features/functions/queries';
import { localizedText } from '../utils/translations';

export function OrganizationDetail() {
  const { id } = useParams<{ id: string }>();
  const organizationId = Number(id);
  const { t, locale } = useI18n();

  const organization = usePublicOrganization(organizationId);
  const functions = usePublicFunctions({ organizationId });
  const organizationName = localizedText(organization.data?.name, organization.data?.nameTranslations, locale);
  const organizationDescription = localizedText(organization.data?.description, organization.data?.descriptionTranslations, locale);
  const functionList = functions.data ?? [];

  return (
    <div className="mx-auto w-full max-w-6xl animate-fade-up px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
      <BackLink to="/#organizations" label={t('nav.organizations')} />

      <Card className="relative mt-5 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-1 bg-brand-gradient" aria-hidden="true" />
        {organization.isPending ? (
          <div className="p-6 sm:p-9"><SkeletonText lines={4} /></div>
        ) : organization.error ? (
          <ErrorState error={organization.error} onRetry={() => void organization.refetch()} />
        ) : organization.data ? (
          <div className="p-6 sm:p-9">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 items-start gap-4 sm:gap-5">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-control bg-brand-gradient-soft text-link sm:h-14 sm:w-14">
                  <Building2Icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <div className="min-w-0 pt-0.5">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-link">{t('field.organization')}</p>
                  <h1 className="mt-2 break-words font-display text-3xl font-bold leading-tight tracking-tight text-content-strong sm:text-4xl">
                    {organizationName}
                  </h1>
                </div>
              </div>
              <StatusPill tone="published" className="w-fit shrink-0">{t('status.active')}</StatusPill>
            </div>
            <div className="mt-7 border-t border-line/80 pt-6">
              <p className="max-w-3xl break-words text-[15px] leading-7 text-content">{organizationDescription ?? '—'}</p>
            </div>
          </div>
        ) : null}
      </Card>

      <section className="mt-12">
        <SectionHeading
          eyebrow={t('nav.functions')}
          title={t('org.functionsTitle')}
          aside={
            !functions.isPending && !functions.error ? (
              <p className="text-sm font-medium tabular-nums text-content-muted" aria-live="polite">
                {functionList.length} {t('home.resultsCount')}
              </p>
            ) : undefined
          }
        />
        <div className="mt-6">
          {functions.isPending ? (
            <SkeletonCards count={3} />
          ) : functions.error ? (
            <Card><ErrorState error={functions.error} onRetry={() => void functions.refetch()} /></Card>
          ) : functionList.length === 0 ? (
            <Card><EmptyState title={t('state.emptyTitle')} description={t('org.emptyFunctions')} /></Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {functionList.map((item) => (
                <FunctionCard key={item.id} item={item} organizationName={organizationName ?? undefined} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
