import { useCallback, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { PageHeader } from '../../components/layout/PageHeader';
import { Badge, StatusPill } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { buttonVariants } from '../../components/ui/buttonVariants';
import { Card } from '../../components/ui/Card';
import { DataTable } from '../../components/ui/DataTable';
import { Select } from '../../components/ui/Select';
import { Toolbar } from '../../components/ui/Toolbar';
import { useI18n } from '../../contexts/i18n';
import { parseId, useScopeOptions } from '../../features/analytics/scope';
import { InlineAlert } from '../../features/functions/InlineAlert';
import { HELP_STATUS_FILTERS, helpStatusFilterLabel, helpStatusLabel, helpStatusTones } from '../../features/help/helpOptions';
import { useHelpInbox } from '../../features/help/queries';
import { QuestionReviewDialog } from '../../features/help/QuestionReviewDialog';
import type { HelpConversationSummary, HelpInboxQuery, HelpStatusFilter } from '../../types/help';
import { formatDateTime } from '../../utils/format';

const LIST_LIMIT = 500;

function parseStatus(value: string | null): HelpStatusFilter {
  return HELP_STATUS_FILTERS.includes(value as HelpStatusFilter) ? (value as HelpStatusFilter) : 'OPEN';
}

/** Inbox of visitor questions; the backend limits it to the caller's organizations (general questions: SUPER_ADMIN). */
export function VisitorQuestions() {
  const { t, locale } = useI18n();
  const scope = useScopeOptions();
  const [params, setParams] = useSearchParams();
  const [selected, setSelected] = useState<HelpConversationSummary | null>(null);

  const query = useMemo<HelpInboxQuery>(() => ({
    status: parseStatus(params.get('status')),
    organizationId: params.get('general') === 'true' ? undefined : parseId(params.get('organization')),
    general: scope.global && params.get('general') === 'true' ? true : undefined,
    assignee: params.get('assignee') === 'me' ? 'me' : undefined,
  }), [params, scope.global]);
  const inbox = useHelpInbox(query);

  const setParam = useCallback((name: string, value: string) => {
    setParams((current) => {
      const next = new URLSearchParams(current);
      if (value) next.set(name, value);
      else next.delete(name);
      return next;
    }, { replace: true });
  }, [setParams]);

  const columns = useMemo<ColumnDef<HelpConversationSummary>[]>(() => [
    {
      accessorKey: 'lastVisitorMessageAt',
      header: t('help.lastVisitorMessage', 'Last visitor message'),
      cell: ({ row }) => <span className="tabular-nums text-secondary">{formatDateTime(row.original.lastVisitorMessageAt, locale)}</span>,
    },
    {
      id: 'subject',
      header: t('reports.subject', 'Subject'),
      accessorFn: (row) => row.serviceName ?? '',
      cell: ({ row }) => (
        <div className="min-w-0 max-w-md">
          <span className="block font-medium text-foreground wrap-anywhere">
            {row.original.general ? t('help.generalQuestionShort', 'General question') : row.original.serviceName ?? `#${row.original.serviceId}`}
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-secondary">
            <span className="tabular-nums">#{row.original.id}</span>
            {!row.original.general && scope.showOrganizations && <span>· {scope.organizationName(row.original.organizationId)}</span>}
            <span>· {row.original.messageCount} {t('help.messagesCount', 'messages')}</span>
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'assignedUserName',
      header: t('help.assignee', 'Responsible staff member'),
      enableSorting: false,
      meta: { hideBelow: 'md' },
      cell: ({ row }) => <span className="text-secondary">{row.original.assignedUserName ?? t('help.unassigned', 'Nobody assigned')}</span>,
    },
    {
      accessorKey: 'status',
      header: t('field.status'),
      cell: ({ row }) => <StatusPill tone={helpStatusTones[row.original.status]}>{helpStatusLabel(row.original.status, t)}</StatusPill>,
    },
    {
      id: 'actions',
      header: t('field.actions'),
      enableSorting: false,
      meta: { align: 'right' },
      cell: ({ row }) => <Button variant="outline" size="sm" onClick={() => setSelected(row.original)}>{t('help.open', 'Open')}</Button>,
    },
  ], [t, locale, scope]);

  const rows = inbox.data ?? [];
  const filtered = params.toString() !== '';

  return (
    <div>
      <PageHeader
        eyebrow={t('nav.admin')}
        title={t('help.inboxTitle', 'Visitor questions')}
        description={t('help.inboxSubtitle', 'Questions visitors asked about services without an account. Reply here; visitors read the answer through their private link. This is not a live chat.')}
      />
      <Card>
        <div className="grid gap-3 border-b border-line px-5 py-4 sm:grid-cols-2 lg:grid-cols-4">
          <Select
            value={query.status ?? 'OPEN'}
            aria-label={t('field.status')}
            size="sm"
            onValueChange={(value) => setParam('status', value === 'OPEN' ? '' : value)}
            options={HELP_STATUS_FILTERS.map((value) => ({ value, label: helpStatusFilterLabel(value, t) }))}
          />
          {scope.showOrganizations && (
            <Select
              value={params.get('general') === 'true' ? 'general' : query.organizationId ? String(query.organizationId) : ''}
              aria-label={t('field.organization')}
              size="sm"
              onValueChange={(value) => {
                setParam('general', value === 'general' ? 'true' : '');
                setParam('organization', value === 'general' ? '' : value);
              }}
              options={[...scope.organizations, ...(scope.global ? [{ value: 'general', label: t('help.generalOnly', 'General questions (site support)') }] : [])]}
            />
          )}
          <Select
            value={query.assignee ?? ''}
            aria-label={t('help.assignee', 'Responsible staff member')}
            size="sm"
            onValueChange={(value) => setParam('assignee', value)}
            options={[
              { value: '', label: t('reports.anyAssignee', 'Any responsible staff member') },
              { value: 'me', label: t('help.assignedToMe', 'Assigned to me') },
            ]}
          />
        </div>
        <Toolbar summary={`${rows.length} ${t('home.resultsCount')}`}>
          {filtered && <Link to="/admin/questions" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>{t('action.reset', 'Reset')}</Link>}
          {scope.global && <Badge size="sm">{t('help.globalScope', 'You see every organization and general questions')}</Badge>}
        </Toolbar>
        {rows.length >= LIST_LIMIT && (
          <div className="border-b border-line px-5 py-3">
            <InlineAlert tone="warning">{t('help.limitNotice', 'Showing the 500 most recently updated conversations. Use the filters to narrow the list.')}</InlineAlert>
          </div>
        )}
        <DataTable
          columns={columns}
          data={rows}
          rowKey={(row) => row.id}
          caption={t('help.inboxTitle', 'Visitor questions')}
          loading={inbox.isPending}
          error={inbox.error}
          onRetry={() => void inbox.refetch()}
          pageSize={25}
          empty={{ title: t('help.emptyTitle', 'No questions here'), description: t('help.emptyText', 'Questions from visitors appear in this list.') }}
        />
      </Card>
      <QuestionReviewDialog conversation={selected} organizationName={scope.organizationName} onClose={() => setSelected(null)} />
    </div>
  );
}
