import { Building2Icon, CheckIcon, FileTextIcon, InfoIcon } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { BackLink } from '../components/catalog/BackLink';
import { Badge } from '../components/ui/Badge';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { SkeletonText } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/States';
import { useI18n } from '../contexts/i18n';
import { usePublicFunction } from '../features/functions/queries';
import { usePublicOrganizations } from '../features/organizations/queries';
import { requirementLines } from '../utils/format';
import { localizedText } from '../utils/translations';

export function FunctionDetail() {
  const { id } = useParams<{ id: string }>();
  const functionId = Number(id);
  const { t, locale } = useI18n();

  const item = usePublicFunction(functionId);
  const organizations = usePublicOrganizations();

  const organization = (organizations.data ?? []).find((org) => org.id === item.data?.organizationId);
  const requirements = requirementLines(item.data?.requirements);
  const functionName = localizedText(item.data?.name, item.data?.nameTranslations, locale);
  const functionDescription = localizedText(item.data?.description, item.data?.descriptionTranslations, locale);
  const organizationName = localizedText(organization?.name, organization?.nameTranslations, locale);

  return (
    <div className="mx-auto w-full max-w-6xl animate-fade-up px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
      <BackLink to="/#functions" label={t('nav.functions')} />

      {item.isPending ? (
        <Card className="mt-5 p-7 sm:p-9"><SkeletonText lines={6} /></Card>
      ) : item.error ? (
        <Card className="mt-5"><ErrorState error={item.error} onRetry={() => void item.refetch()} /></Card>
      ) : item.data ? (
        <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(18rem,0.85fr)] lg:items-start">
          <Card className="relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-1 bg-brand-gradient" aria-hidden="true" />
            <article className="p-6 sm:p-9">
              <div className="flex flex-wrap items-center gap-2">
                {item.data.category && <Badge tone="brand">{item.data.category}</Badge>}
                <Badge tone="neutral">ID {item.data.id}</Badge>
              </div>

              <h1 className="mt-5 break-words font-display text-2xl font-bold leading-tight tracking-tight text-content-strong sm:text-3xl">
                {functionName}
              </h1>

              {organization && (
                <Link
                  to={`/organizations/${organization.id}`}
                  className="press mt-4 inline-flex min-h-10 max-w-full items-center gap-2 rounded-control border border-line bg-surface-subtle/70 px-3 text-sm font-medium text-content transition-colors duration-fast hover:border-brand/40 hover:bg-brand-subtle hover:text-link"
                >
                  <Building2Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">{organizationName}</span>
                </Link>
              )}

              <div className="mt-8 border-t border-line/80 pt-7">
                <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-content-muted">{t('fn.aboutTitle')}</h2>
                <p className="mt-3 break-words text-[15px] leading-7 text-content">{functionDescription ?? '—'}</p>
              </div>
            </article>
          </Card>

          <aside className="space-y-4">
            <Card>
              <CardHeader title={t('field.requirements')} icon={<FileTextIcon className="h-4 w-4" aria-hidden="true" />} />
              <CardBody>
                {requirements.length === 0 ? (
                  <p className="flex items-start gap-2.5 text-[13px] leading-6 text-content-muted">
                    <InfoIcon className="mt-1 h-4 w-4 shrink-0 text-content-subtle" aria-hidden="true" />
                    {t('fn.requirementsEmpty')}
                  </p>
                ) : (
                  <ol className="space-y-3.5">
                    {requirements.map((line, index) => (
                      <li key={index} className="flex items-start gap-3 text-[13px] leading-6 text-content">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-positive/10 text-positive">
                          <CheckIcon className="h-3 w-3" aria-hidden="true" />
                        </span>
                        <span className="min-w-0 break-words">{line}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </CardBody>
            </Card>

            <p className="border-l-2 border-line-strong px-4 py-2 text-xs leading-5 text-content-muted">{t('app.demoNotice')}</p>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
