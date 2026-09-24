import { ArrowLeftIcon, Building2Icon, CheckIcon, FileTextIcon, InfoIcon } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { SkeletonText } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/States';
import { useAsync } from '../hooks/useAsync';
import { useI18n } from '../contexts/i18n';
import { getFunction } from '../services/functionService';
import { getPublicOrganizations } from '../services/organizationService';
import { requirementLines } from '../utils/format';
import { localizedText } from '../utils/translations';

export function FunctionDetail() {
  const { id } = useParams<{ id: string }>();
  const functionId = Number(id);
  const { t, locale } = useI18n();

  const item = useAsync(() => getFunction(functionId), [functionId]);
  const organizations = useAsync(getPublicOrganizations, []);

  const organization = (organizations.data ?? []).find((org) => org.id === item.data?.organizationId);
  const requirements = requirementLines(item.data?.requirements);
  const functionName = localizedText(item.data?.name, item.data?.nameTranslations, locale);
  const functionDescription = localizedText(item.data?.description, item.data?.descriptionTranslations, locale);
  const organizationName = localizedText(organization?.name, organization?.nameTranslations, locale);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
      <Link
        to="/#functions"
        className="inline-flex min-h-11 items-center gap-2 rounded-full pr-3 text-sm font-semibold text-content-muted transition-colors hover:text-content-strong"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white shadow-card">
          <ArrowLeftIcon className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
        </span>
        {t('nav.functions')}
      </Link>

      {item.loading ? (
        <div className="mt-5 rounded-card border border-line bg-white p-7 shadow-card sm:p-9">
          <SkeletonText lines={6} />
        </div>
      ) : item.error ? (
        <div className="mt-5 overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-card">
          <ErrorState error={item.error} onRetry={item.reload} />
        </div>
      ) : item.data ? (
        <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(18rem,0.85fr)] lg:items-start">
          <article className="overflow-hidden rounded-card border border-line bg-white shadow-card">
            <div className="h-1 bg-accent" aria-hidden="true" />
            <div className="p-6 sm:p-9">
              <div className="flex flex-wrap items-center gap-2">
                {item.data.category && <Badge tone="teal">{item.data.category}</Badge>}
                <Badge tone="navy">ID {item.data.id}</Badge>
              </div>

              <h1 className="mt-5 break-words font-display text-2xl font-extrabold leading-tight tracking-tight text-navy-950 sm:text-3xl">
                {functionName}
              </h1>

              {organization && (
                <Link
                  to={`/organizations/${organization.id}`}
                  className="mt-4 inline-flex min-h-11 max-w-full items-center gap-2 rounded-lg border border-navy-100 bg-navy-50 px-3 text-sm font-semibold text-navy-700 transition-colors hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
                >
                  <Building2Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">{organizationName}</span>
                </Link>
              )}

              <div className="mt-8 border-t border-navy-100 pt-7">
                <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-navy-400">
                  {t('fn.aboutTitle')}
                </h2>
                <p className="mt-3 break-words text-[15px] leading-7 text-navy-600">
                  {functionDescription ?? '—'}
                </p>
              </div>
            </div>
          </article>

          <aside className="space-y-4">
            <section className="overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-card">
              <header className="flex items-center gap-3 border-b border-navy-100 px-5 py-4 sm:px-6">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                  <FileTextIcon className="h-4 w-4" aria-hidden="true" />
                </span>
                <h2 className="font-display text-sm font-bold text-navy-950">{t('field.requirements')}</h2>
              </header>
              <div className="px-5 py-5 sm:px-6">
                {requirements.length === 0 ? (
                  <p className="flex items-start gap-2.5 text-[13px] leading-6 text-navy-500">
                    <InfoIcon className="mt-1 h-4 w-4 shrink-0 text-navy-300" aria-hidden="true" />
                    {t('fn.requirementsEmpty')}
                  </p>
                ) : (
                  <ol className="space-y-3.5">
                    {requirements.map((line, index) => (
                      <li key={index} className="flex items-start gap-3 text-[13px] leading-6 text-navy-700">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-700">
                          <CheckIcon className="h-3 w-3" aria-hidden="true" />
                        </span>
                        <span className="min-w-0 break-words">{line}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </section>

            <div className="border-l-2 border-navy-200 px-4 py-2">
              <p className="text-xs leading-5 text-navy-500">{t('app.demoNotice')}</p>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
