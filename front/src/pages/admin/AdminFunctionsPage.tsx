import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { LanguagesIcon, PlusIcon, TriangleAlertIcon } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardBody } from '../../components/ui/Card';
import { DataTable } from '../../components/ui/DataTable';
import { Field } from '../../components/ui/Field';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge, FunctionStatusBadge } from '../../components/ui/Badge';
import { buttonVariants } from '../../components/ui/buttonVariants';
import { Tooltip } from '../../components/ui/Tooltip';
import { Toolbar } from '../../components/ui/Toolbar';
import { FunctionErrorState } from '../../features/functions/FunctionErrorState';
import { useAdminFunctions, useFunctionOptions } from '../../features/functions/queries';
import { useI18n } from '../../contexts/i18n';
import { useAuth } from '../../contexts/auth';
import { ApiError } from '../../services/http';
import { functionText, hasFunctionTranslation } from '../../utils/functionLocalization';
import { localizedText } from '../../utils/translations';
import { FUNCTION_STATUSES, statusLabels, type AdminFunction } from '../../types/adminFunctions';

const PAGE_SIZE = 50;

export function AdminFunctionsPage() {
  const { t, locale, available } = useI18n();
  const { hasPermission } = useAuth();
  const canView = hasPermission('FUNCTIONS_VIEW');
  const functions = useAdminFunctions(canView);
  const options = useFunctionOptions();
  const [status, setStatus] = useState('');
  const [organization, setOrganization] = useState('');
  const [category, setCategory] = useState('');
  const [language, setLanguage] = useState(locale);
  const [search, setSearch] = useState('');
  const forbidden = useMemo(() => new ApiError(403, t('state.forbidden')), [t]);

  useEffect(() => setLanguage(locale), [locale]);

  const organizationName = useCallback(
    (id: number | null) =>
      options.data?.organizations.find((item) => item.id === id)?.name ?? (id === null ? t('fnAdmin.unassigned') : `#${id}`),
    [options.data, t],
  );

  const rows = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return (functions.data ?? [])
      .filter(
        (row) =>
          (!status || row.status === status) &&
          (!organization || (organization === 'unassigned' ? row.organizationId === null : row.organizationId === Number(organization))) &&
          (!category || row.categoryId === Number(category)) &&
          functionText(row, 'name', language).toLocaleLowerCase().includes(term),
      )
      .sort((a, b) => b.id - a.id);
  }, [functions.data, status, organization, category, language, search]);

  const columns = useMemo<ColumnDef<AdminFunction>[]>(
    () => [
      {
        id: 'name',
        header: t('field.name'),
        accessorFn: (row) => functionText(row, 'name', language),
        cell: ({ row }) => (
          <div className="min-w-0 max-w-md" lang={language}>
            <Link to={`/admin/functions/${row.original.id}`} className="rounded-sm font-medium text-foreground underline-offset-4 wrap-anywhere fine:hover:underline">
              {functionText(row.original, 'name', language)}
            </Link>
            <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-secondary wrap-anywhere">{functionText(row.original, 'description', language)}</p>
            {!hasFunctionTranslation(row.original, language) && (
              <p className="mt-1 inline-flex items-center gap-1 text-xs text-status-pending" lang={locale}>
                <TriangleAlertIcon className="h-3 w-3" aria-hidden="true" />
                {t('fnAdmin.missingTranslation', 'Translation missing; showing original')}
              </p>
            )}
          </div>
        ),
      },
      {
        id: 'organization',
        header: t('field.organization'),
        accessorFn: (row) => organizationName(row.organizationId),
        meta: { hideBelow: 'md' },
        cell: ({ row }) => <span className="text-secondary wrap-anywhere">{organizationName(row.original.organizationId)}</span>,
      },
      {
        id: 'category',
        header: t('field.category'),
        enableSorting: false,
        meta: { hideBelow: 'lg' },
        cell: ({ row }) => {
          const value = options.data?.categories.find((item) => item.id === row.original.categoryId);
          const label = value ? localizedText(value.name, value.nameTranslations, language) : row.original.category;
          return label ? <Badge size="sm" tone="accent">{label}</Badge> : <span className="text-secondary">—</span>;
        },
      },
      {
        accessorKey: 'status',
        header: t('field.status'),
        cell: ({ row }) => <FunctionStatusBadge status={row.original.status} />,
      },
      {
        id: 'languages',
        header: t('fnAdmin.languages'),
        enableSorting: false,
        meta: { hideBelow: 'xl' },
        cell: ({ row }) => {
          const filled = available.filter((item) => hasFunctionTranslation(row.original, item.code));
          const complete = filled.length === available.length;
          return (
            <Tooltip content={filled.map((item) => item.label).join(', ') || '—'}>
              <span tabIndex={0} className="inline-flex cursor-default items-center gap-1.5 rounded-pill border border-line px-2.5 py-1 text-xs font-medium tabular-nums text-secondary">
                <LanguagesIcon className="h-3 w-3" aria-hidden="true" />
                <span className={complete ? 'text-status-published' : undefined}>{filled.length}/{available.length}</span>
              </span>
            </Tooltip>
          );
        },
      },
      {
        id: 'actions',
        header: t('field.actions'),
        enableSorting: false,
        meta: { align: 'right', mobileHidden: true },
        cell: ({ row }) => (
          <Link to={`/admin/functions/${row.original.id}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            {hasPermission('FUNCTIONS_EDIT') && row.original.status === 'DRAFT' ? t('action.edit') : t('action.details')}
          </Link>
        ),
      },
    ],
    [t, language, locale, available, options.data, hasPermission, organizationName],
  );

  return (
    <div>
      <PageHeader
        eyebrow={t('nav.admin')}
        title={t('nav.functions')}
        description={t('fnAdmin.subtitle', 'Drafts, review queue and published services.')}
        actions={
          hasPermission('FUNCTIONS_CREATE') ? (
            <Link to="/admin/functions/new" className={buttonVariants({ variant: 'dark', size: 'sm' })}>
              <PlusIcon aria-hidden="true" />
              {t('fnAdmin.create')}
            </Link>
          ) : undefined
        }
      />

      <Card className="mb-6">
        <CardBody>
          <p className="micro mb-4 text-secondary">{t('fnAdmin.filters', 'Filters')}</p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <Field label={t('field.status')}>
              {(control) => (
                <Select
                  {...control}
                  size="sm"
                  value={status}
                  onValueChange={setStatus}
                  options={[
                    { value: '', label: t('status.all') },
                    ...FUNCTION_STATUSES.map((value) => ({ value, label: t(`fnAdmin.status.${value}`, statusLabels[value]) })),
                  ]}
                />
              )}
            </Field>
            <Field label={t('field.organization')}>
              {(control) => (
                <Select
                  {...control}
                  size="sm"
                  value={organization}
                  onValueChange={setOrganization}
                  options={[
                    { value: '', label: t('status.all') },
                    { value: 'unassigned', label: t('fnAdmin.unassigned', 'Unassigned') },
                    ...(options.data?.organizations ?? []).map((item) => ({ value: String(item.id), label: item.name })),
                  ]}
                />
              )}
            </Field>
            <Field label={t('field.category')}>
              {(control) => (
                <Select
                  {...control}
                  size="sm"
                  value={category}
                  onValueChange={setCategory}
                  options={[
                    { value: '', label: t('status.all') },
                    ...(options.data?.categories ?? []).map((item) => ({
                      value: String(item.id),
                      label: localizedText(item.name, item.nameTranslations, language) ?? item.name,
                    })),
                  ]}
                />
              )}
            </Field>
            <Field label={t('field.language')}>
              {(control) => (
                <Select
                  {...control}
                  size="sm"
                  value={language}
                  onValueChange={setLanguage}
                  options={available.map((item) => ({ value: item.code, label: item.label }))}
                />
              )}
            </Field>
            <Field label={t('action.search')}>
              {(control) => <Input {...control} type="search" className="min-h-10 py-2 text-sm" value={search} onChange={(event) => setSearch(event.target.value)} />}
            </Field>
          </div>
          {Boolean(options.error) && <div className="mt-4"><FunctionErrorState error={options.error} onRetry={() => void options.refetch()} /></div>}
        </CardBody>
      </Card>

      <Card>
        {canView ? (
          <>
            <Toolbar summary={`${rows.length} ${t('home.resultsCount')}`} />
            <DataTable
              columns={columns}
              data={rows}
              rowKey={(row) => row.id}
              caption={t('nav.functions')}
              pageSize={PAGE_SIZE}
              loading={functions.isPending}
              error={functions.error}
              onRetry={() => void functions.refetch()}
              empty={{ title: t('state.emptyTitle'), description: t('state.emptyText') }}
            />
          </>
        ) : (
          <FunctionErrorState error={forbidden} />
        )}
      </Card>
    </div>
  );
}
