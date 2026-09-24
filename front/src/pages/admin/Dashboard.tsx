import { Link } from 'react-router-dom';
import { ArrowUpRightIcon, BuildingIcon, FileTextIcon, ShieldCheckIcon, UsersIcon } from 'lucide-react';
import { PageHeader } from '../../components/layout/AdminLayout';
import { Panel, PanelHeader } from '../../components/ui/Card';
import { Badge, StatusBadge } from '../../components/ui/Badge';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { Skeleton } from '../../components/ui/Skeleton';
import { useAsync } from '../../hooks/useAsync';
import { useAuth } from '../../contexts/auth';
import { useI18n } from '../../contexts/i18n';
import { getOrganizations } from '../../services/organizationService';
import { getAdminFunctions } from '../../services/adminFunctionService';
import { functionText } from '../../utils/functionLocalization';
import { FunctionStatusBadge } from '../../components/functions/FunctionStatusBadge';
import type { AdminFunction } from '../../types/adminFunctions';
import { getModerators, getOrgAdmins } from '../../services/staffService';
import type { Organization } from '../../types/api';
import { formatDate, fullName, roleLabel, truncate } from '../../utils/format';

export function Dashboard() {
  const { t, locale } = useI18n();
  const { user, isSuperAdmin, hasRole, hasPermission } = useAuth();
  const canSeeOrgAdmins = isSuperAdmin;
  const canSeeModerators = hasRole('ROLE_SUPER_ADMIN', 'ROLE_ORG_ADMIN');

  const organizations = useAsync(getOrganizations, []);
  const canSeeFunctions = hasPermission('FUNCTIONS_VIEW');
  const functions = useAsync(() => canSeeFunctions ? getAdminFunctions() : Promise.resolve([]), [canSeeFunctions]);
  const orgAdmins = useAsync(() => canSeeOrgAdmins ? getOrgAdmins() : Promise.resolve([]), [canSeeOrgAdmins]);
  const moderators = useAsync(() => canSeeModerators ? getModerators() : Promise.resolve([]), [canSeeModerators]);

  const orgList = organizations.data ?? [];
  const fnList = functions.data ?? [];

  const cards = [
  {
    label: t('admin.summaryOrgs'),
    value: orgList.length,
    hint: `${orgList.filter((item) => item.enabled).length} ${t('status.active').toLowerCase()}`,
    icon: BuildingIcon,
    to: '/admin/organizations',
    loading: organizations.loading,
    visible: true
  },
  {
    label: t('admin.summaryOrgAdmins'),
    value: (orgAdmins.data ?? []).length,
    hint: `${(orgAdmins.data ?? []).filter((item) => item.enabled).length} ${t('status.active').toLowerCase()}`,
    icon: ShieldCheckIcon,
    to: '/admin/org-admins',
    loading: orgAdmins.loading,
    visible: canSeeOrgAdmins
  },
  {
    label: t('admin.summaryModerators'),
    value: (moderators.data ?? []).length,
    hint: `${(moderators.data ?? []).filter((item) => item.enabled).length} ${t('status.active').toLowerCase()}`,
    icon: UsersIcon,
    to: '/admin/moderators',
    loading: moderators.loading,
    visible: canSeeModerators
  },
  {
    label: t('admin.summaryFunctions'),
    value: fnList.length,
    hint: `${new Set(fnList.map((item) => item.category)).size} ${t('field.category').toLowerCase()}`,
    icon: FileTextIcon,
    to: '/admin/functions',
    loading: functions.loading,
    visible: canSeeFunctions
  }].
  filter((card) => card.visible);

  const orgColumns: Column<Organization>[] = [
  {
    key: 'id',
    header: t('field.id'),
    className: 'hidden md:table-cell',
    headerClassName: 'hidden md:table-cell',
    render: (row) => <span className="text-navy-400">#{row.id}</span>
  },
  {
    key: 'name',
    header: t('field.name'),
    render: (row) =>
    <Link to={`/organizations/${row.id}`} className="font-medium text-navy-900 hover:text-teal-700">
          {row.name}
        </Link>

  },
  { key: 'enabled', header: t('field.status'), render: (row) => <StatusBadge enabled={row.enabled} /> },
  {
    key: 'createdAt',
    header: t('field.createdAt'),
    className: 'hidden sm:table-cell',
    headerClassName: 'hidden sm:table-cell',
    render: (row) => <span className="text-navy-500">{formatDate(row.createdAt, locale)}</span>
  }];


  const fnColumns: Column<AdminFunction>[] = [
  { key: 'status', header: t('field.status'), render: row => <FunctionStatusBadge status={row.status} /> },
  {
    key: 'id',
    header: t('field.id'),
    className: 'hidden lg:table-cell',
    headerClassName: 'hidden lg:table-cell',
    render: (row) => <span className="text-navy-400">#{row.id}</span>
  },
  {
    key: 'name',
    header: t('field.name'),
    render: (row) =>
    <div>
          <Link to={`/admin/functions/${row.id}`} className="font-medium text-navy-900 hover:text-teal-700">
            {functionText(row, 'name', locale)}
          </Link>
          <p className="text-[12px] text-navy-400">{truncate(functionText(row, 'description', locale), 70)}</p>
        </div>

  },
  {
    key: 'category',
    header: t('field.category'),
    className: 'hidden sm:table-cell',
    headerClassName: 'hidden sm:table-cell',
    render: (row) => row.category ? <Badge tone="navy">{row.category}</Badge> : <span>—</span>
  },
  {
    key: 'organization',
    header: t('field.organization'),
    className: 'hidden lg:table-cell',
    headerClassName: 'hidden lg:table-cell',
    render: (row) =>
    <span className="text-navy-500">{orgList.find((org) => org.id === row.organizationId)?.name ?? '—'}</span>

  },
  ...(canSeeFunctions ?
  [
  {
    key: 'actions',
    header: t('field.actions'),
    className: 'text-right',
    headerClassName: 'text-right',
    render: (row: AdminFunction) =>
    <Link
      to={`/admin/functions/${row.id}`}
      className="inline-flex min-h-11 items-center rounded-lg px-2 text-[13px] font-semibold text-teal-700 transition-colors hover:bg-teal-50 hover:text-teal-800">
      
                {t('action.details')}
              </Link>

  }] :

  [])];


  return (
    <div>
      <PageHeader
        title={`${t('admin.welcome')}${user ? `, ${fullName(user)}` : ''}`}
        description={user ? `${roleLabel(user.role, t)} · ${user.email}` : undefined}
        badge={user ? <Badge tone="teal">{roleLabel(user.role, t)}</Badge> : undefined} />
      

      <div className="grid gap-4 min-[420px]:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) =>
        <Link
          key={`${card.to}-${card.label}`}
          to={card.to}
          className="group relative overflow-hidden rounded-2xl border border-navy-100 bg-white p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-pop sm:p-6">
          
            <div className="flex items-start justify-between gap-3">
              <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-navy-500">{card.label}</span>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 ring-1 ring-inset ring-teal-100 transition-colors group-hover:bg-teal-100">
                <card.icon className="h-[18px] w-[18px]" aria-hidden="true" />
              </span>
            </div>
            {card.loading ?
          <Skeleton className="mt-3 h-8 w-16" /> :

          <p className="mt-3 font-display text-[32px] font-extrabold leading-none tracking-tight text-navy-950">{card.value}</p>
          }
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-[12px] text-navy-400">{card.hint}</p>
              <ArrowUpRightIcon className="h-4 w-4 text-navy-300 transition-colors group-hover:text-teal-600" aria-hidden="true" />
            </div>
          </Link>
        )}
      </div>

      <div className="mt-7 grid gap-6">
        <Panel className="overflow-hidden [&_table]:!min-w-0">
          <PanelHeader
            title={t('admin.recentOrgs')}
            description={t('home.orgsSubtitle')}
            actions={
            <Link to="/admin/organizations" className="text-[13px] font-medium text-teal-700 hover:underline">
                {t('action.viewAll')}
              </Link>
            } />
          
          <DataTable
            columns={orgColumns}
            rows={[...orgList].
            sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).
            slice(0, 5)}
            rowKey={(row) => row.id}
            loading={organizations.loading}
            error={organizations.error}
            onRetry={organizations.reload}
            emptyTitle={t('state.emptyTitle')}
            caption={t('admin.recentOrgs')} />
          
        </Panel>

        {canSeeFunctions && <Panel className="overflow-hidden [&_table]:!min-w-0">
          <PanelHeader title={t('admin.recentFunctions')} description={t('home.catalogSubtitle')}
            actions={<Link className="text-brand hover:underline" to="/admin/functions">{t('action.viewAll')}</Link>} />
          <DataTable
            columns={fnColumns}
            rows={fnList.slice(0, 8)}
            rowKey={(row) => row.id}
            loading={functions.loading}
            error={functions.error}
            onRetry={functions.reload}
            emptyTitle={t('state.emptyTitle')}
            caption={t('admin.recentFunctions')} />
          
        </Panel>}
      </div>
    </div>);

}
