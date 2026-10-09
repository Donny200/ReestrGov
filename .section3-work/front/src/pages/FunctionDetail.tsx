import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeftIcon, BuildingIcon, CheckCircle2Icon, FileTextIcon, InfoIcon } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { SkeletonText } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/States';
import { useAsync } from '../hooks/useAsync';
import { useI18n } from '../contexts/I18nContext';
import { getFunction } from '../services/functionService';
import { getPublicOrganizations } from '../services/organizationService';
import { requirementLines } from '../utils/format';
import { localizedText } from '../utils/translations';

export function FunctionDetail() {
  const { id } = useParams<{id: string;}>();
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
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <Link
        to="/#functions"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-navy-500 transition-colors hover:text-navy-900">
        
        <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
        {t('nav.functions')}
      </Link>

      {item.loading ?
      <div className="mt-4 rounded-xl border border-navy-100 bg-white p-8 shadow-card">
          <SkeletonText lines={5} />
        </div> :
      item.error ?
      <div className="mt-4 rounded-xl border border-navy-100 bg-white shadow-card">
          <ErrorState error={item.error} onRetry={item.reload} />
        </div> :
      item.data ?
      <div className="mt-4 grid gap-6 lg:grid-cols-3">
          <section className="lg:col-span-2">
            <div className="rounded-xl border border-navy-100 bg-white p-6 shadow-card sm:p-8">
              <div className="flex flex-wrap items-center gap-2">
                {item.data.category && <Badge tone="teal">{item.data.category}</Badge>}
                <Badge tone="navy">ID {item.data.id}</Badge>
              </div>
              <h1 className="mt-4 font-display text-2xl font-extrabold leading-snug tracking-tight text-navy-900">
                {functionName}
              </h1>
              {organization &&
            <Link
              to={`/organizations/${organization.id}`}
              className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-teal-700 hover:underline">
              
                  <BuildingIcon className="h-4 w-4" aria-hidden="true" />
                  {organizationName}
                </Link>
            }

              <h2 className="mt-6 font-display text-sm font-semibold uppercase tracking-wide text-navy-400">
                {t('fn.aboutTitle')}
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-navy-600">{functionDescription ?? '—'}</p>
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-xl border border-navy-100 bg-white shadow-card">
              <header className="flex items-center gap-2 border-b border-navy-100 px-5 py-4">
                <FileTextIcon className="h-4 w-4 text-teal-600" aria-hidden="true" />
                <h2 className="font-display text-sm font-semibold text-navy-900">{t('field.requirements')}</h2>
              </header>
              <div className="px-5 py-4">
                {requirements.length === 0 ?
              <p className="flex items-start gap-2 text-[13px] leading-relaxed text-navy-500">
                    <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-navy-300" aria-hidden="true" />
                    {t('fn.requirementsEmpty')}
                  </p> :

              <ol className="space-y-3">
                    {requirements.map((line, index) =>
                <li key={index} className="flex items-start gap-2.5 text-[13.5px] leading-relaxed text-navy-700">
                        <CheckCircle2Icon className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" aria-hidden="true" />
                        {line}
                      </li>
                )}
                  </ol>
              }
              </div>
            </div>

            <div className="rounded-xl border border-navy-100 bg-navy-50 p-5">
              <p className="text-[12px] leading-relaxed text-navy-500">{t('app.demoNotice')}</p>
            </div>
          </aside>
        </div> :
      null}
    </div>);

}
