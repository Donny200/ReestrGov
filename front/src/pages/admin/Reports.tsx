import { useCallback, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { ExternalLinkIcon, FlagIcon, PencilIcon } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../../components/layout/PageHeader';
import { Badge, StatusPill, type StatusTone } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { buttonVariants } from '../../components/ui/buttonVariants';
import { Card } from '../../components/ui/Card';
import { DataTable } from '../../components/ui/DataTable';
import { Field } from '../../components/ui/Field';
import { Textarea } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { Toolbar } from '../../components/ui/Toolbar';
import { useAuth } from '../../contexts/auth';
import { useI18n } from '../../contexts/i18n';
import { InlineAlert } from '../../features/functions/InlineAlert';
import { useReports, useUpdateReportStatus } from '../../features/reports/queries';
import {
  REPORT_NOTE_MAX,
  REPORT_STATUS_FILTERS,
  REPORT_TRANSITIONS,
  reportCategoryLabels,
  reportStatusFilterLabels,
  reportStatusLabels,
} from '../../features/reports/reportOptions';
import type { InformationReport, ReportEntityType, ReportStatus, ReportStatusFilter } from '../../types/reports';
import { errorMessage } from '../../utils/errors';
import { formatDateTime } from '../../utils/format';

const LIST_LIMIT = 500;

const statusTones: Record<ReportStatus, StatusTone> = {
  NEW: 'pending',
  IN_REVIEW: 'draft',
  RESOLVED: 'published',
  DISMISSED: 'danger',
};

const actionLabels: Record<ReportStatus, { key: string; fallback: string }> = {
  NEW: { key: 'reports.markNew', fallback: 'Mark as new' },
  IN_REVIEW: { key: 'reports.startReview', fallback: 'Start review' },
  RESOLVED: { key: 'reports.resolve', fallback: 'Mark resolved' },
  DISMISSED: { key: 'reports.dismiss', fallback: 'Dismiss' },
};

function publicPath(report: InformationReport): string {
  return report.entityType === 'FUNCTION' ? `/functions/${report.entityId}` : `/organizations/${report.entityId}`;
}

function parseStatus(value: string | null): ReportStatusFilter {
  return REPORT_STATUS_FILTERS.includes(value as ReportStatusFilter) ? (value as ReportStatusFilter) : 'OPEN';
}

function parseEntityType(value: string | null): ReportEntityType | '' {
  return value === 'FUNCTION' || value === 'ORGANIZATION' ? value : '';
}

export function Reports() {
  const { t, locale } = useI18n();
  const { hasPermission } = useAuth();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<ReportStatusFilter>(parseStatus(searchParams.get('status')));
  const [entityType, setEntityType] = useState<ReportEntityType | ''>(parseEntityType(searchParams.get('entityType')));
  const entityId = Number(searchParams.get('entityId')) || undefined;
  const reports = useReports({ status, entityType: entityType || undefined, entityId });
  const update = useUpdateReportStatus();
  const [selected, setSelected] = useState<InformationReport | null>(null);
  const [note, setNote] = useState('');
  const canManage = hasPermission('REPORTS_MANAGE');

  const resetUpdate = update.reset;

  const typeLabel = useCallback(
    (type: ReportEntityType) => (type === 'FUNCTION' ? t('reports.typeFunction', 'Service') : t('reports.typeOrganization', 'Organization')),
    [t],
  );
  const statusLabel = useCallback((value: ReportStatus) => t(`reports.status.${value}`, reportStatusLabels[value]), [t]);

  const open = useCallback(
    (report: InformationReport) => {
      setSelected(report);
      setNote(report.resolutionNote ?? '');
      resetUpdate();
    },
    [resetUpdate],
  );

  const changeStatus = (target: ReportStatus) => {
    if (!selected) return;
    update.mutate(
      { id: selected.id, status: target, note: note.trim() },
      {
        onSuccess: (saved) => {
          setSelected(saved);
          toast.success(t('toast.updated', 'Saved successfully'));
        },
      },
    );
  };

  const columns = useMemo<ColumnDef<InformationReport>[]>(
    () => [
      {
        accessorKey: 'createdAt',
        header: t('reports.received', 'Received'),
        cell: ({ row }) => <span className="tabular-nums text-secondary">{formatDateTime(row.original.createdAt, locale)}</span>,
      },
      {
        id: 'subject',
        header: t('reports.subject', 'Subject'),
        accessorFn: (row) => row.entityLabel,
        cell: ({ row }) => (
          <div className="min-w-0 max-w-md">
            <span className="block font-medium text-foreground wrap-anywhere">{row.original.entityLabel}</span>
            <span className="mt-1 flex flex-wrap items-center gap-1.5">
              <Badge size="sm">{typeLabel(row.original.entityType)}</Badge>
              <span className="text-xs tabular-nums text-secondary">#{row.original.entityId}</span>
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'category',
        header: t('reports.category', 'Problem'),
        enableSorting: false,
        meta: { hideBelow: 'md' },
        cell: ({ row }) => (
          <span className="text-secondary">{t(`report.category.${row.original.category}`, reportCategoryLabels[row.original.category])}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: t('field.status'),
        cell: ({ row }) => <StatusPill tone={statusTones[row.original.status]}>{statusLabel(row.original.status)}</StatusPill>,
      },
      {
        id: 'actions',
        header: t('field.actions'),
        enableSorting: false,
        meta: { align: 'right' },
        cell: ({ row }) => (
          <Button variant="outline" size="sm" onClick={() => open(row.original)}>
            {t('reports.review', 'Review')}
          </Button>
        ),
      },
    ],
    [t, locale, typeLabel, statusLabel, open],
  );

  const rows = reports.data ?? [];

  return (
    <div>
      <PageHeader
        eyebrow={t('nav.admin')}
        title={t('reports.title', 'Information reports')}
        description={t('reports.subtitle', 'Visitor reports about incorrect or outdated information. Reports are private and never change public pages automatically.')}
      />
      <Card>
        <Toolbar summary={`${rows.length} ${t('home.resultsCount')}`}>
          <Select
            value={status}
            aria-label={t('field.status')}
            onValueChange={(value) => setStatus(parseStatus(value))}
            className="sm:w-44"
            options={REPORT_STATUS_FILTERS.map((value) => ({
              value,
              label: value === 'OPEN' || value === 'ALL' ? t(`reports.filter.${value}`, reportStatusFilterLabels[value]) : statusLabel(value),
            }))}
          />
          <Select
            value={entityType}
            aria-label={t('reports.type', 'Type')}
            onValueChange={(value) => setEntityType(parseEntityType(value))}
            className="sm:w-44"
            options={[
              { value: '', label: `${t('reports.type', 'Type')} · ${t('status.all')}` },
              { value: 'FUNCTION', label: typeLabel('FUNCTION') },
              { value: 'ORGANIZATION', label: typeLabel('ORGANIZATION') },
            ]}
          />
        </Toolbar>
        {entityId && (
          <div className="border-b border-line px-5 py-3">
            <InlineAlert tone="info" action={<Link to="/admin/reports" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>{t('action.reset', 'Reset')}</Link>}>
              {t('reports.filteredByEntity', 'Showing reports for one item')} #{entityId}
            </InlineAlert>
          </div>
        )}
        {rows.length >= LIST_LIMIT && (
          <div className="border-b border-line px-5 py-3">
            <InlineAlert tone="warning">{t('reports.limitNotice', 'Showing the newest 500 reports. Use the filters to narrow the list.')}</InlineAlert>
          </div>
        )}
        <DataTable
          columns={columns}
          data={rows}
          rowKey={(row) => row.id}
          caption={t('reports.title', 'Information reports')}
          loading={reports.isPending}
          error={reports.error}
          onRetry={() => void reports.refetch()}
          pageSize={25}
          empty={{ title: t('reports.emptyTitle', 'No reports here'), description: t('reports.emptyText', 'New reports from visitors will appear in this list.') }}
        />
      </Card>

      <Modal
        open={selected !== null}
        onClose={() => setSelected(null)}
        closeDisabled={update.isPending}
        size="lg"
        icon={<FlagIcon aria-hidden="true" />}
        title={selected?.entityLabel ?? ''}
        description={selected ? `${typeLabel(selected.entityType)} #${selected.entityId} · ${formatDateTime(selected.createdAt, locale)}` : undefined}
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill tone={statusTones[selected.status]}>{statusLabel(selected.status)}</StatusPill>
              <Badge size="sm" tone="accent">{t(`report.category.${selected.category}`, reportCategoryLabels[selected.category])}</Badge>
              {selected.language && <Badge size="sm">{selected.language.toUpperCase()}</Badge>}
            </div>
            <section aria-label={t('reports.description', 'Report')}>
              <p className="micro text-secondary">{t('reports.description', 'Report')}</p>
              <p lang={selected.language ?? undefined} className="mt-2 whitespace-pre-wrap rounded-control bg-surface px-4 py-3 text-base leading-7 text-foreground wrap-anywhere">
                {selected.description}
              </p>
            </section>
            <div>
              <p className="micro text-secondary">{t('reports.contact', 'Reporter contact')}</p>
              <p className="mt-1 text-sm text-foreground wrap-anywhere">
                {selected.contact ?? (
                  <span className="text-secondary">
                    {selected.status === 'RESOLVED' || selected.status === 'DISMISSED'
                      ? t('reports.contactErased', 'Not stored: contact details are deleted when a report is closed.')
                      : t('reports.noContact', 'The visitor did not leave contact details.')}
                  </span>
                )}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to={publicPath(selected)} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                <ExternalLinkIcon aria-hidden="true" />
                {t('reports.openPublic', 'Open public page')}
              </Link>
              {selected.entityType === 'FUNCTION' && hasPermission('FUNCTIONS_VIEW') && (
                <Link to={`/admin/functions/${selected.entityId}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                  <PencilIcon aria-hidden="true" />
                  {t('reports.openEditor', 'Open in editor')}
                </Link>
              )}
            </div>
            <InlineAlert tone="info">
              {t('reports.noAutoChange', 'Correct the information through the normal editing and review process. Changing the report status does not change the public page.')}
            </InlineAlert>
            {canManage ? (
              <div className="space-y-4 border-t border-line pt-5">
                <Field label={t('reports.note', 'Internal note')} hint={t('reports.noteHint', 'Visible to staff only.')}>
                  {(control) => (
                    <Textarea {...control} rows={3} maxLength={REPORT_NOTE_MAX} value={note} disabled={update.isPending} onChange={(event) => setNote(event.target.value)} />
                  )}
                </Field>
                {Boolean(update.error) && <InlineAlert tone="danger">{errorMessage(update.error, t)}</InlineAlert>}
                <div className="flex flex-wrap justify-end gap-2">
                  {REPORT_TRANSITIONS[selected.status].map((target) => (
                    <Button
                      key={target}
                      variant={target === 'DISMISSED' ? 'outline' : 'dark'}
                      size="sm"
                      loading={update.isPending && update.variables?.status === target}
                      disabled={update.isPending}
                      onClick={() => changeStatus(target)}
                    >
                      {t(actionLabels[target].key, actionLabels[target].fallback)}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              selected.resolutionNote && (
                <div>
                  <p className="micro text-secondary">{t('reports.note', 'Internal note')}</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-foreground wrap-anywhere">{selected.resolutionNote}</p>
                </div>
              )
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
