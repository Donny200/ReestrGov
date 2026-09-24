import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/layout/AdminLayout';
import { Panel, PanelBody } from '../../components/ui/Card';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { Field, Select, TextInput } from '../../components/ui/Field';
import { Button } from '../../components/ui/Button';
import { ErrorState } from '../../components/ui/States';
import { FunctionStatusBadge, FUNCTION_STATUSES, statusLabels } from '../../components/functions/FunctionStatusBadge';
import { useI18n } from '../../contexts/i18n';
import { useAuth } from '../../contexts/auth';
import { useAsync } from '../../hooks/useAsync';
import { useFunctionOptions } from '../../hooks/useFunctionOptions';
import { getAdminFunctions } from '../../services/adminFunctionService';
import { localizedText } from '../../utils/translations';
import type { AdminFunction } from '../../types/adminFunctions';
import { ApiError } from '../../services/http';

export function AdminFunctionsPage() {
  const { t, locale, available } = useI18n();
  const { hasPermission } = useAuth();
  const canView = hasPermission('FUNCTIONS_VIEW');
  const functions = useAsync(() => canView ? getAdminFunctions() : Promise.reject(new ApiError(403, t('state.forbidden'))), [canView]);
  const options = useFunctionOptions();
  const [status, setStatus] = useState('');
  const [organization, setOrganization] = useState('');
  const [category, setCategory] = useState('');
  const [language, setLanguage] = useState(locale);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  useEffect(() => { setLanguage(locale); }, [locale]);
  useEffect(() => { setPage(1); }, [status, organization, category, language, search]);
  const rows = (functions.data ?? []).filter((row) =>
    (!status || row.status === status) &&
    (!organization || (organization === 'unassigned' ? row.organizationId === null : row.organizationId === Number(organization))) &&
    (!category || row.categoryId === Number(category)) &&
    (localizedText(row.name, row.nameTranslations, language) ?? '').toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())
  ).sort((a, b) => b.id - a.id);
  const pages = Math.max(1, Math.ceil(rows.length / 50));
  const currentPage = Math.min(page, pages);
  const columns: Column<AdminFunction>[] = [
    { key: 'name', header: t('field.name'), render: row => <div>
      <Link className="font-semibold text-brand hover:underline" to={`/admin/functions/${row.id}`}>{localizedText(row.name, row.nameTranslations, language)}</Link>
      <p className="mt-1 text-xs text-content-muted">{localizedText(row.description, row.descriptionTranslations, language)}</p>
      {language !== row.sourceLanguage && !row.nameTranslations?.[language]?.text?.trim() &&
        <p className="mt-1 text-xs text-amber-700">{t('fnAdmin.missingTranslation', 'Translation missing; showing original')}</p>}
    </div> },
    { key: 'organization', header: t('field.organization'), render: row =>
      options.data?.organizations.find(org => org.id === row.organizationId)?.name ??
        (row.organizationId === null ? t('fnAdmin.unassigned', 'Unassigned') : '#' + row.organizationId) },
    { key: 'category', header: t('field.category'), render: row => {
      const value = options.data?.categories.find(item => item.id === row.categoryId);
      return value ? localizedText(value.name, value.nameTranslations, language) : row.category ?? '—';
    } },
    { key: 'status', header: t('field.status'), render: row => <FunctionStatusBadge status={row.status} /> },
    { key: 'languages', header: t('fnAdmin.languages', 'Languages'), render: row => {
      const filled = available.filter(lang => lang.code === row.sourceLanguage ||
        (row.nameTranslations?.[lang.code]?.text?.trim() && (!row.description || row.descriptionTranslations?.[lang.code]?.text?.trim())));
      return <span title={filled.map(lang => lang.label).join(', ')}>{filled.length}/{available.length} · {filled.map(lang => lang.code).join(', ')}</span>;
    } },
    { key: 'actions', header: t('field.actions'), render: row => <Link className="inline-flex min-h-11 items-center font-semibold text-brand hover:underline"
      to={`/admin/functions/${row.id}`}>{hasPermission('FUNCTIONS_EDIT') && row.status === 'DRAFT' ? t('action.edit') : t('action.details')}</Link> },
  ];
  return <div>
    <PageHeader title={t('nav.functions')} description={t('fnAdmin.subtitle', 'Drafts, review queue and published services.')}
      actions={hasPermission('FUNCTIONS_CREATE') ? <Link className="inline-flex min-h-11 items-center rounded-control bg-brand px-4 font-semibold text-white" to="/admin/functions/new">{t('fnAdmin.create')}</Link> : undefined} />
    <Panel><PanelBody>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Field label={t('field.status')}>{() => <Select value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">{t('status.all')}</option>
          {FUNCTION_STATUSES.map(value => <option key={value} value={value}>{t('fnAdmin.status.' + value, statusLabels[value])}</option>)}
        </Select>}</Field>
        <Field label={t('field.organization')}>{() => <Select value={organization} onChange={e => setOrganization(e.target.value)}>
          <option value="">{t('status.all')}</option><option value="unassigned">{t('fnAdmin.unassigned', 'Unassigned')}</option>
          {options.data?.organizations.map(org => <option key={org.id} value={org.id}>{org.name}</option>)}
        </Select>}</Field>
        <Field label={t('field.category')}>{() => <Select value={category} onChange={e => setCategory(e.target.value)}>
          <option value="">{t('status.all')}</option>
          {options.data?.categories.map(item => <option key={item.id} value={item.id}>{localizedText(item.name, item.nameTranslations, language)}</option>)}
        </Select>}</Field>
        <Field label={t('field.language')}>{() => <Select value={language} onChange={e => setLanguage(e.target.value)}>
          {available.map(lang => <option key={lang.code} value={lang.code}>{lang.label}</option>)}
        </Select>}</Field>
        <Field label={t('action.search')}>{() => <TextInput type="search" value={search} onChange={e => setSearch(e.target.value)} />}</Field>
      </div>
      {Boolean(options.error) && <ErrorState error={options.error} onRetry={options.reload} />}
    </PanelBody>
      <DataTable columns={columns} rows={rows.slice((currentPage - 1) * 50, currentPage * 50)} rowKey={row => row.id}
        loading={functions.loading} error={functions.error} onRetry={functions.reload} emptyTitle={t('state.emptyTitle')} caption={t('nav.functions')} />
      {rows.length > 50 && <div className="flex items-center justify-between gap-3 border-t border-line p-4">
        <Button variant="outline" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>{t('fnAdmin.previous', 'Previous')}</Button>
        <span aria-live="polite">{currentPage} / {pages}</span>
        <Button variant="outline" disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)}>{t('fnAdmin.next', 'Next')}</Button>
      </div>}
    </Panel>
  </div>;
}
