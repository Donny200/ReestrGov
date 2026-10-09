import React from 'react';
import { Link } from 'react-router-dom';
import { BuildingIcon, FileTextIcon, ShieldCheckIcon, UsersIcon } from 'lucide-react';
import { PageHeader } from '../../components/layout/AdminLayout';
import { Panel, PanelBody, PanelHeader } from '../../components/ui/Card';
import { Badge, StatusBadge } from '../../components/ui/Badge';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { Skeleton } from '../../components/ui/Skeleton';
import { useAsync } from '../../hooks/useAsync';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import { getOrganizations } from '../../services/organizationService';
import { getFunctions } from '../../services/functionService';
import { getModerators, getOrgAdmins } from '../../services/staffService';
import type { CatalogFunction, Organization } from '../../types/api';
import { formatDate, fullName, roleLabel, truncate } from '../../utils/format';

export function Dashboard() {
  const { t } = useI18n();
  const { user, isSuperAdmin, hasRole } = useAuth();
  const canSeeOrgAdmins = isSuperAdmin;
  const canSeeModerators = hasRole('ROLE_SUPER_ADMIN', 'ROLE_ORG_ADMIN');

  const organizations = useAsync(getOrganizations, []);
  const functions = useAsync(() => getFunctions(), []);
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
    to: '/admin/organizations',
    loading: functions.loading,
    visible: true
  }].
  filter((card) => card.visible);

  const orgColumns: Column<Organization>[] = [
  { key: 'id', header: t('field.id'), render: (row) => <span className="text-navy-400">#{row.id}</span> },
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
    render: (row) => <span className="text-navy-500">{formatDate(row.createdAt)}</span>
  }];


  const fnColumns: Column<CatalogFunction>[] = [
  { key: 'id', header: t('field.id'), render: (row) => <span className="text-navy-400">#{row.id}</span> },
  {
    key: 'name',
    header: t('field.name'),
    render: (row) =>
    <div>
          <Link to={`/functions/${row.id}`} className="font-medium text-navy-900 hover:text-teal-700">
            {row.name}
          </Link>
          <p className="text-[12px] text-navy-400">{truncate(row.description, 70)}</p>
        </div>

  },
  {
    key: 'category',
    header: t('field.category'),
    render: (row) => row.category ? <Badge tone="navy">{row.category}</Badge> : <span>—</span>
  },
  {
    key: 'organization',
    header: t('field.organization'),
    render: (row) =>
    <span className="text-navy-500">{orgList.find((org) => org.id === row.organizationId)?.name ?? '—'}</span>

  },
  ...(hasRole('ROLE_SUPER_ADMIN', 'ROLE_ORG_ADMIN') ?
  [
  {
    key: 'actions',
    header: t('field.actions'),
    className: 'text-right',
    headerClassName: 'text-right',
    render: (row: CatalogFunction) =>
    <Link
      to={`/admin/functions/${row.id}/edit`}
      className="text-[13px] font-medium text-teal-700 hover:underline">
      
                {t('fnEdit.title')}
              </Link>

  }] :

  [])];


  return (
    <div>
      <PageHeader
        title={`${t('admin.welcome')}${user ? `, ${fullName(user)}` : ''}`}
        description={user ? `${roleLabel(user.role)} · ${user.email}` : undefined}
        badge={user ? <Badge tone="teal">{roleLabel(user.role)}</Badge> : undefined} />
      

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) =>
        <Link
          key={card.label}
          to={card.to}
          className="rounded-xl border border-navy-100 bg-white p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-pop">
          
            <div className="flex items-center justify-between">
              <span className="text-[12.5px] font-medium text-navy-500">{card.label}</span>
              <card.icon className="h-4 w-4 text-teal-600" aria-hidden="true" />
            </div>
            {card.loading ?
          <Skeleton className="mt-3 h-8 w-16" /> :

          <p className="mt-2 font-display text-3xl font-extrabold text-navy-900">{card.value}</p>
          }
            <p className="mt-1 text-[12px] text-navy-400">{card.hint}</p>
          </Link>
        )}
      </div>

      <div className="mt-6 grid gap-6">
        <Panel>
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

        <Panel>
          <PanelHeader title={t('admin.recentFunctions')} description={t('home.catalogSubtitle')} />
          <DataTable
            columns={fnColumns}
            rows={fnList.slice(0, 8)}
            rowKey={(row) => row.id}
            loading={functions.loading}
            error={functions.error}
            onRetry={functions.reload}
            emptyTitle={t('state.emptyTitle')}
            caption={t('admin.recentFunctions')} />
          
        </Panel>
      </div>
    </div>);

}