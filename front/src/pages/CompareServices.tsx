import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ColumnsIcon, Trash2Icon, XIcon } from 'lucide-react';
import { toast } from 'sonner';
import { OrganizationContactDetails } from '../components/catalog/OrganizationContactDetails';
import { PrintButton } from '../components/catalog/PrintButton';
import { ShareButton } from '../components/catalog/ShareButton';
import { SectionHeading } from '../components/home/SectionHeading';
import { Button } from '../components/ui/Button';
import { buttonVariants } from '../components/ui/buttonVariants';
import { Card } from '../components/ui/Card';
import { ConfirmModal } from '../components/ui/Modal';
import { SkeletonList } from '../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../components/ui/States';
import { useI18n } from '../contexts/i18n';
import { usePublicFunctions } from '../features/functions/queries';
import { usePublicOrganizations } from '../features/organizations/queries';
import { parseCompareIds } from '../features/compare/compareStore';
import { useCompare } from '../features/compare/useCompare';
import type { CatalogFunction, PublicOrganization } from '../types/api';
import { hasContactDetails } from '../utils/contact';
import { formatDate } from '../utils/format';
import { instructionItems, localizedInstruction } from '../utils/instructions';
import { requirementLines } from '../utils/format';
import { localizedText } from '../utils/translations';

type Translate = (key: string, fallback?: string) => string;

function Missing({ t }: { t: Translate }) {
  return <span className="text-secondary">{t('instructions.notSpecified', 'Not specified')}</span>;
}

function Lines({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1 ps-4">
      {items.map((item, index) => <li key={index} className="wrap-anywhere">{item}</li>)}
    </ul>
  );
}

interface Row {
  key: string;
  label: string;
  render: (service: CatalogFunction, organization: PublicOrganization | undefined) => ReactNode;
}

export function CompareServices() {
  const { t, locale } = useI18n();
  const [params, setParams] = useSearchParams();
  const compare = useCompare();
  const { replace } = compare;
  const functions = usePublicFunctions();
  const organizations = usePublicOrganizations();
  const [confirmClear, setConfirmClear] = useState(false);

  const published = useMemo(() => new Map((functions.data ?? []).map((item) => [item.id, item])), [functions.data]);

  // A shared link (?ids=) replaces the browser's own selection once published services are known; unknown or
  // unpublished ids are dropped with a notice, then the URL no longer carries the ids.
  const linked = params.get('ids');
  const [linkedDropped, setLinkedDropped] = useState(false);
  useEffect(() => {
    if (linked === null || !functions.data) return;
    const requested = parseCompareIds(linked, 10);
    const kept = requested.filter((id) => published.has(id)).slice(0, compare.limit);
    setLinkedDropped(kept.length < requested.length);
    replace(kept);
    setParams({}, { replace: true });
  }, [linked, functions.data, published, replace, setParams, compare.limit]);
  const organizationById = useMemo(() => new Map((organizations.data ?? []).map((item) => [item.id, item])), [organizations.data]);
  const selected = compare.ids.map((id) => published.get(id)).filter((item): item is CatalogFunction => Boolean(item));
  const unavailable = functions.data ? compare.ids.filter((id) => !published.has(id)) : [];
  const showUnavailable = unavailable.length > 0 || linkedDropped;
  const shareUrl = `/compare?ids=${selected.map((item) => item.id).join(',')}`;

  const instruction = (service: CatalogFunction, field: 'whoCanUse' | 'steps' | 'requiredDocuments' | 'whereHowToApply' | 'processingTime' | 'fee') =>
    localizedInstruction(service, field, locale);

  const rows: Row[] = [
    {
      key: 'description',
      label: t('field.description', 'Description'),
      render: (service) => {
        const text = localizedText(service.description, service.descriptionTranslations, locale);
        return text ? <span className="wrap-anywhere">{text}</span> : <Missing t={t} />;
      },
    },
    {
      key: 'organization',
      label: t('field.organization', 'Organization'),
      render: (_service, organization) =>
        organization ? (
          <Link to={`/organizations/${organization.id}`} className="rounded-sm font-medium underline-offset-4 fine:hover:underline">
            {localizedText(organization.name, organization.nameTranslations, locale) ?? organization.name}
          </Link>
        ) : (
          <span className="text-secondary">{t('fn.organizationUnknown', 'Organization unknown')}</span>
        ),
    },
    {
      key: 'category',
      label: t('field.category', 'Category'),
      render: (service) => service.category ?? <Missing t={t} />,
    },
    {
      key: 'whoCanUse',
      label: t('instructions.whoCanUse', 'Who can use this service'),
      render: (service) => instruction(service, 'whoCanUse')?.text ?? <Missing t={t} />,
    },
    {
      key: 'documents',
      label: t('instructions.requiredDocuments', 'Required documents'),
      render: (service) => {
        const documents = instruction(service, 'requiredDocuments');
        const requirements = requirementLines(service.requirements);
        if (documents) return <Lines items={instructionItems(documents.text)} />;
        if (requirements.length > 0) return <Lines items={requirements} />;
        return <Missing t={t} />;
      },
    },
    {
      key: 'steps',
      label: t('instructions.steps', 'Step-by-step procedure'),
      render: (service) => {
        const steps = instruction(service, 'steps');
        return steps ? <ol className="list-decimal space-y-1 ps-4">{instructionItems(steps.text).map((item, index) => <li key={index} className="wrap-anywhere">{item}</li>)}</ol> : <Missing t={t} />;
      },
    },
    {
      key: 'whereHowToApply',
      label: t('instructions.whereHowToApply', 'Where and how to apply'),
      render: (service) => instruction(service, 'whereHowToApply')?.text ?? <Missing t={t} />,
    },
    {
      key: 'processingTime',
      label: t('instructions.processingTime', 'Processing time'),
      render: (service) => instruction(service, 'processingTime')?.text ?? <Missing t={t} />,
    },
    {
      key: 'fee',
      label: t('instructions.fee', 'Official fee'),
      render: (service) => instruction(service, 'fee')?.text ?? <Missing t={t} />,
    },
    {
      key: 'contacts',
      label: t('compare.contacts', 'Organization contacts'),
      render: (_service, organization) =>
        organization && hasContactDetails(organization.contact) ? (
          <OrganizationContactDetails contact={organization.contact} />
        ) : (
          <span className="text-secondary">{t('contact.notProvided', 'Not provided yet')}</span>
        ),
    },
    {
      key: 'verified',
      label: t('verification.lastVerified', 'Last verified'),
      render: (service) =>
        service.lastVerifiedAt && (service.verificationStatus === 'VERIFIED' || service.verificationStatus === 'DUE') ? (
          formatDate(service.lastVerifiedAt, locale)
        ) : (
          <span className="text-secondary">{t('verification.unverifiedShort', 'Not marked as verified')}</span>
        ),
    },
    {
      key: 'updated',
      label: t('history.lastUpdated', 'Last updated'),
      render: (service) => (service.lastUpdatedAt ? formatDate(service.lastUpdatedAt, locale) : <Missing t={t} />),
    },
  ];

  const clearAll = () => {
    compare.clear();
    setConfirmClear(false);
    toast.success(t('compare.cleared', 'Comparison cleared'));
  };

  return (
    <div className="shell py-10 sm:py-14 lg:py-16 print:py-0">
      <SectionHeading
        eyebrow={t('nav.compare', 'Compare')}
        title={t('compare.title', 'Compare services')}
        description={t('compare.subtitle', 'Up to three published services side by side. Your selection is kept only in this browser.')}
        aside={
          selected.length > 0 ? (
            <div className="flex flex-wrap gap-2 print:hidden">
              <ShareButton title={t('compare.title', 'Compare services')} path={shareUrl} />
              <PrintButton label={t('compare.print', 'Print comparison')} />
              <Button variant="danger" size="sm" icon={<Trash2Icon />} onClick={() => setConfirmClear(true)}>
                {t('compare.clear', 'Clear selection')}
              </Button>
            </div>
          ) : undefined
        }
      />

      <div className="mt-8">
        {compare.ids.length === 0 ? (
          <Card>
            <EmptyState
              icon={<ColumnsIcon className="h-6 w-6" aria-hidden="true" />}
              title={t('compare.emptyTitle', 'No services selected yet')}
              description={t('compare.emptyText', 'Use the Compare button on a service to add it here. You can compare two or three services.')}
              action={<Link to="/#functions" className={buttonVariants({ variant: 'dark', size: 'sm' })}>{t('nav.catalog')}</Link>}
            />
          </Card>
        ) : functions.isPending || organizations.isPending ? (
          <SkeletonList count={3} />
        ) : functions.error ? (
          <Card><ErrorState error={functions.error} onRetry={() => void functions.refetch()} /></Card>
        ) : (
          <>
            {showUnavailable && (
              <p className="mb-4 rounded-control bg-status-pending-bg px-4 py-3 text-sm text-status-pending print:hidden" role="status">
                {t('compare.unavailable', 'Some selected services are no longer published and were left out.')}{' '}
                {unavailable.length > 0 && (
                  <button type="button" className="font-medium underline-offset-4 fine:hover:underline" onClick={() => compare.replace(selected.map((item) => item.id))}>
                    {t('compare.dropUnavailable', 'Remove them from the selection')}
                  </button>
                )}
              </p>
            )}
            {selected.length === 1 && (
              <p className="mb-4 text-sm leading-6 text-secondary print:hidden">{t('compare.addMore', 'Add at least one more service to compare.')}</p>
            )}
            <div className="hidden border-b border-line pb-4 text-sm leading-6 print:block">
              <p className="font-semibold">{t('app.name')}</p>
              <p>{t('print.printedOn', 'Printed on')} {formatDate(new Date().toISOString(), locale)}</p>
            </div>
            <div className="overflow-x-auto rounded-card-sm border border-line" role="region" aria-labelledby="compare-table-caption" tabIndex={0}>
              <table className="w-full min-w-[40rem] border-collapse text-sm leading-6">
                <caption id="compare-table-caption" className="sr-only">{t('compare.title', 'Compare services')}</caption>
                <thead>
                  <tr className="align-top">
                    <th scope="col" className="sticky start-0 z-10 w-40 bg-surface p-3 text-start text-xs font-medium uppercase tracking-[0.025em] text-secondary">{t('compare.field', 'Field')}</th>
                    {selected.map((service) => {
                      const name = localizedText(service.name, service.nameTranslations, locale) ?? service.name;
                      return (
                        <th key={service.id} scope="col" lang={locale} className="min-w-[14rem] bg-surface p-3 text-start align-top">
                          <div className="flex items-start justify-between gap-2">
                            <Link to={`/functions/${service.id}`} className="rounded-sm text-base font-semibold text-foreground underline-offset-4 wrap-anywhere fine:hover:underline">{name}</Link>
                            <Button variant="ghost" size="iconSm" className="print:hidden" aria-label={`${t('compare.remove', 'Remove from comparison')}: ${name}`} onClick={() => compare.remove(service.id)}>
                              <XIcon aria-hidden="true" />
                            </Button>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.key} className="border-t border-line align-top">
                      <th scope="row" className="sticky start-0 z-10 bg-background p-3 text-start text-xs font-medium uppercase tracking-[0.025em] text-secondary">{row.label}</th>
                      {selected.map((service) => (
                        <td key={service.id} lang={locale} className="p-3 text-foreground wrap-anywhere">{row.render(service, organizationById.get(service.organizationId))}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm leading-6 text-secondary">{t('compare.notice', '“Not specified” means the organization has not published that detail yet; confirm it with the organization before you apply.')}</p>
          </>
        )}
      </div>

      <ConfirmModal
        open={confirmClear}
        title={t('compare.clear', 'Clear selection')}
        message={t('compare.clearConfirm', 'Remove every service from the comparison?')}
        confirmLabel={t('compare.clear', 'Clear selection')}
        cancelLabel={t('action.cancel', 'Cancel')}
        onConfirm={clearAll}
        onClose={() => setConfirmClear(false)}
      />
    </div>
  );
}
