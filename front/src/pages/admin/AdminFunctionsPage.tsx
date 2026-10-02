import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { FilterIcon, LanguagesIcon, PlusIcon, TriangleAlertIcon } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardBody } from '../../components/ui/Card';
import { DataTable } from '../../components/ui/DataTable';
import { Field } from '../../components/ui/Field';
import { Input, Select } from '../../components/ui/Input';
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
          <div className="min-w-0 max-w-md">
            <Link to={`/admin/functions/${row.original.id}`} className="font-medium text-content-strong transition-colors hover:text-link">
              {functionText(row.original, 'name', language)}
            </Link>
            <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-content-muted">{functionText(row.original, 'description', language)}</p>
            {!hasFunctionTranslation(row.original, language) && (
              <p className="mt-1 inline-flex items-center gap-1 text-xs text-warning">
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
        cell: ({ row }) => <span className="text-content-muted">{organizationName(row.original.organizationId)}</span>,
      },
      {
        id: 'category',
        header: t('field.category'),
        enableSorting: false,
        meta: { hideBelow: 'lg' },
        cell: ({ row }) => {
          const value = options.data?.categories.find((item) => item.id === row.original.categoryId);
          const label = value ? localizedText(value.name, value.nameTranslations, language) : row.original.category;
          return label ? <Badge tone="brand">{label}</Badge> : <span className="text-content-subtle">—</span>;
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
              <span tabIndex={0} className="inline-flex cursor-default items-center gap-1.5 rounded-full border border-line bg-surface-subtle px-2 py-0.5 text-xs font-medium tabular-nums text-content-muted">
                <LanguagesIcon className="h-3 w-3" aria-hidden="true" />
                <span className={complete ? 'text-positive' : undefined}>{filled.length}/{available.length}</span>
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
          <Link to={`/admin/functions/${row.original.id}`} className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
            {hasPermission('FUNCTIONS_EDIT') && row.original.status === 'DRAFT' ? t('action.edit') : t('action.details')}
          </Link>
        ),
      },
    ],
    [t, language, available, options.data, hasPermission, organizationName],
  );

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow={t('nav.admin')}
        title={t('nav.functions')}
        description={t('fnAdmin.subtitle', 'Drafts, review queue and published services.')}
        actions={
          hasPermission('FUNCTIONS_CREATE') ? (
            <Link to="/admin/functions/new" className={buttonVariants({ variant: 'gradient' })}>
              <PlusIcon aria-hidden="true" />
              {t('fnAdmin.create')}
            </Link>
          ) : undefined
        }
      />

      <Card>
        <CardBody className="border-b border-line/80">
          <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-content-muted">
            <FilterIcon className="h-4 w-4" aria-hidden="true" />
            {t('fnAdmin.filters', 'Filters')}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <Field label={t('field.status')}>
              {(control) => (
                <Select {...control} value={status} onChange={(event) => setStatus(event.target.value)}>
                  <option value="">{t('status.all')}</option>
                  {FUNCTION_STATUSES.map((value) => (
                    <option key={value} value={value}>{t(`fnAdmin.status.${value}`, statusLabels[value])}</option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label={t('field.organization')}>
              {(control) => (
                <Select {...control} value={organization} onChange={(event) => setOrganization(event.target.value)}>
                  <option value="">{t('status.all')}</option>
                  <option value="unassigned">{t('fnAdmin.unassigned', 'Unassigned')}</option>
                  {options.data?.organizations.map((item) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label={t('field.category')}>
              {(control) => (
                <Select {...control} value={category} onChange={(event) => setCategory(event.target.value)}>
                  <option value="">{t('status.all')}</option>
                  {options.data?.categories.map((item) => (
                    <option key={item.id} value={item.id}>{localizedText(item.name, item.nameTranslations, language)}</option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label={t('field.language')}>
              {(control) => (
                <Select {...control} value={language} onChange={(event) => setLanguage(event.target.value)}>
                  {available.map((item) => (
                    <option key={item.code} value={item.code}>{item.label}</option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label={t('action.search')}>
              {(control) => <Input {...control} type="search" value={search} onChange={(event) => setSearch(event.target.value)} />}
            </Field>
          </div>
          {Boolean(options.error) && <div className="mt-4"><FunctionErrorState error={options.error} onRetry={() => void options.refetch()} /></div>}
        </CardBody>
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
