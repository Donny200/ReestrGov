import { CheckIcon, InfoIcon } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { BackLink } from '../components/catalog/BackLink';
import { Badge } from '../components/ui/Badge';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Eyebrow } from '../components/ui/Eyebrow';
import { Reveal } from '../components/ui/Reveal';
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
    <div className="shell py-8 sm:py-12 lg:py-16">
      <BackLink to="/#functions" label={t('nav.functions')} />

      {item.isPending ? (
        <Card size="lg" className="mt-6 p-8 sm:p-10"><SkeletonText lines={6} /></Card>
      ) : item.error ? (
        <Card size="lg" className="mt-6"><ErrorState error={item.error} onRetry={() => void item.refetch()} /></Card>
      ) : item.data ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(18rem,0.85fr)] lg:items-start">
          <Reveal as="article" className="min-w-0">
            <Eyebrow>{t('nav.functions')}</Eyebrow>
            <h1 lang={locale} className="mt-4 text-4xl font-semibold text-foreground wrap-anywhere sm:text-5xl">{functionName}</h1>

            <section className="mt-10 border-t border-line pt-8" aria-labelledby="function-about">
              <h2 id="function-about" className="micro text-secondary">{t('fn.aboutTitle')}</h2>
              <p lang={locale} className="mt-4 max-w-3xl text-lg leading-8 text-foreground wrap-anywhere">{functionDescription ?? '—'}</p>
            </section>

            <section className="mt-10 border-t border-line pt-8" aria-labelledby="function-requirements">
              <h2 id="function-requirements" className="micro text-secondary">{t('field.requirements')}</h2>
              {requirements.length === 0 ? (
                <p className="mt-4 flex items-start gap-2.5 text-base leading-7 text-secondary">
                  <InfoIcon className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" />
                  {t('fn.requirementsEmpty')}
                </p>
              ) : (
                <ol className="mt-4 space-y-3">
                  {requirements.map((line, index) => (
                    <li key={index} className="flex items-start gap-3 text-base leading-7 text-foreground">
                      <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-pill bg-status-published-bg text-status-published">
                        <CheckIcon className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
                      </span>
                      <span className="min-w-0 wrap-anywhere">{line}</span>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </Reveal>

          <Reveal as="aside" index={1} className="lg:sticky lg:top-28">
            <Card>
              <CardHeader title={t('field.organization')} />
              <CardBody>
                <dl className="space-y-5">
                  <div>
                    <dt className="micro text-secondary">{t('field.organization')}</dt>
                    <dd className="mt-1.5 text-base font-medium text-foreground wrap-anywhere">
                      {organization ? (
                        <Link lang={locale} to={`/organizations/${organization.id}`} className="rounded-sm underline-offset-4 fine:hover:underline">
                          {organizationName}
                        </Link>
                      ) : (
                        t('fn.organizationUnknown', 'Organization unknown')
                      )}
                    </dd>
                  </div>
                  {item.data.category && (
                    <div>
                      <dt className="micro text-secondary">{t('field.category')}</dt>
                      <dd className="mt-1.5"><Badge tone="accent" size="sm">{item.data.category}</Badge></dd>
                    </div>
                  )}
                  <div>
                    <dt className="micro text-secondary">{t('field.id')}</dt>
                    <dd className="mt-1.5 text-base font-medium tabular-nums text-foreground">{item.data.id}</dd>
                  </div>
                </dl>
              </CardBody>
            </Card>
            <p className="mt-4 border-s-2 border-line ps-4 text-sm leading-6 text-secondary">{t('app.demoNotice')}</p>
          </Reveal>
        </div>
      ) : null}
    </div>
  );
}
