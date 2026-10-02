import { useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { ActivityIcon, BuildingIcon, FileTextIcon, PlusIcon, ShieldCheckIcon, UsersIcon } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Badge, FunctionStatusBadge, StatusBadge } from '../../components/ui/Badge';
import { buttonVariants } from '../../components/ui/buttonVariants';
import { DataTable } from '../../components/ui/DataTable';
import { StatCard } from '../../components/ui/StatCard';
import { Skeleton } from '../../components/ui/Skeleton';
import { useOrganizations } from '../../features/organizations/queries';
import { useAdminFunctions } from '../../features/functions/queries';
import { staffKeys } from '../../features/queryKeys';
import { getModerators, getOrgAdmins } from '../../services/staffService';
import { useAuth } from '../../contexts/auth';
import { useI18n } from '../../contexts/i18n';
import { functionText } from '../../utils/functionLocalization';
import { formatDate, fullName, roleLabel, truncate } from '../../utils/format';
import { FUNCTION_STATUSES, type AdminFunction } from '../../types/adminFunctions';
import type { Organization } from '../../types/api';

export function Dashboard() {
  const { t, locale } = useI18n();
  const { user, isSuperAdmin, hasRole, hasPermission } = useAuth();
  const canSeeOrgAdmins = isSuperAdmin;
  const canSeeModerators = hasRole('ROLE_SUPER_ADMIN', 'ROLE_ORG_ADMIN');
  const canSeeFunctions = hasPermission('FUNCTIONS_VIEW');

  const organizations = useOrganizations();
  const functions = useAdminFunctions(canSeeFunctions);
  const orgAdmins = useQuery({ queryKey: staffKeys.orgAdmins(), queryFn: getOrgAdmins, enabled: canSeeOrgAdmins });
  const moderators = useQuery({ queryKey: staffKeys.moderators(), queryFn: getModerators, enabled: canSeeModerators });

  const orgList = useMemo(() => organizations.data ?? [], [organizations.data]);
  const fnList = useMemo(() => functions.data ?? [], [functions.data]);
  const activeLabel = t('status.active').toLowerCase();
  const organizationName = useCallback((id: number | null) => orgList.find((item) => item.id === id)?.name ?? '—', [orgList]);

  const cards = [
    {
      key: 'organizations',
      label: t('admin.summaryOrgs'),
      value: orgList.length,
      hint: `${orgList.filter((item) => item.enabled).length} ${activeLabel}`,
      icon: BuildingIcon,
      to: '/admin/organizations',
      loading: organizations.isPending,
      visible: true,
      tone: 'brand' as const,
    },
    {
      key: 'org-admins',
      label: t('admin.summaryOrgAdmins'),
      value: (orgAdmins.data ?? []).length,
      hint: `${(orgAdmins.data ?? []).filter((item) => item.enabled).length} ${activeLabel}`,
      icon: ShieldCheckIcon,
      to: '/admin/org-admins',
      loading: orgAdmins.isPending,
      visible: canSeeOrgAdmins,
      tone: 'info' as const,
    },
    {
      key: 'moderators',
      label: t('admin.summaryModerators'),
      value: (moderators.data ?? []).length,
      hint: `${(moderators.data ?? []).filter((item) => item.enabled).length} ${activeLabel}`,
      icon: UsersIcon,
      to: '/admin/moderators',
      loading: moderators.isPending,
      visible: canSeeModerators,
      tone: 'success' as const,
    },
    {
      key: 'functions',
      label: t('admin.summaryFunctions'),
      value: fnList.length,
      hint: `${fnList.filter((item) => item.status === 'PUBLISHED').length} ${t('fnAdmin.status.PUBLISHED').toLowerCase()}`,
      icon: FileTextIcon,
      to: '/admin/functions',
      loading: functions.isPending,
      visible: canSeeFunctions,
      tone: 'warning' as const,
    },
  ].filter((card) => card.visible);

  const recentOrganizations = useMemo(
    () => [...orgList].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5),
    [orgList],
  );
  const recentFunctions = useMemo(() => [...fnList].sort((a, b) => b.id - a.id).slice(0, 8), [fnList]);
  const breakdown = FUNCTION_STATUSES.map((status) => {
    const count = fnList.filter((item) => item.status === status).length;
    return { status, count, share: fnList.length === 0 ? 0 : Math.round((count / fnList.length) * 100) };
  });

  const organizationColumns = useMemo<ColumnDef<Organization>[]>(
    () => [
      {
        accessorKey: 'name',
        header: t('field.name'),
        cell: ({ row }) => (
          <Link to={`/organizations/${row.original.id}`} className="font-medium text-content-strong transition-colors hover:text-link">
            {row.original.name}
          </Link>
        ),
      },
      { accessorKey: 'enabled', header: t('field.status'), enableSorting: false, cell: ({ row }) => <StatusBadge enabled={row.original.enabled} /> },
      {
        accessorKey: 'createdAt',
        header: t('field.createdAt'),
        meta: { hideBelow: 'md' },
        cell: ({ row }) => <span className="tabular-nums text-content-muted">{formatDate(row.original.createdAt, locale)}</span>,
      },
    ],
    [t, locale],
  );

  const functionColumns = useMemo<ColumnDef<AdminFunction>[]>(
    () => [
      { accessorKey: 'status', header: t('field.status'), enableSorting: false, cell: ({ row }) => <FunctionStatusBadge status={row.original.status} /> },
      {
        id: 'name',
        header: t('field.name'),
        accessorFn: (row) => functionText(row, 'name', locale),
        cell: ({ row }) => (
          <div className="min-w-0 max-w-md">
            <Link to={`/admin/functions/${row.original.id}`} className="font-medium text-content-strong transition-colors hover:text-link">
              {functionText(row.original, 'name', locale)}
            </Link>
            <p className="mt-0.5 text-xs text-content-muted">{truncate(functionText(row.original, 'description', locale), 80)}</p>
          </div>
        ),
      },
      {
        accessorKey: 'category',
        header: t('field.category'),
        enableSorting: false,
        meta: { hideBelow: 'lg' },
        cell: ({ row }) => (row.original.category ? <Badge tone="brand">{row.original.category}</Badge> : <span className="text-content-subtle">—</span>),
      },
      {
        id: 'organization',
        header: t('field.organization'),
        enableSorting: false,
        meta: { hideBelow: 'xl' },
        cell: ({ row }) => <span className="text-content-muted">{organizationName(row.original.organizationId)}</span>,
      },
    ],
    [t, locale, organizationName],
  );

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow={t('nav.dashboard')}
        title={`${t('admin.welcome')}${user ? `, ${fullName(user)}` : ''}`}
        description={user ? `${roleLabel(user.role, t)} · ${user.email}` : undefined}
        badge={user ? <Badge tone="brand" dot glow>{roleLabel(user.role, t)}</Badge> : undefined}
        actions={
          hasPermission('FUNCTIONS_CREATE') ? (
            <Link to="/admin/functions/new" className={buttonVariants({ variant: 'gradient' })}>
              <PlusIcon aria-hidden="true" />
              {t('fnAdmin.create')}
            </Link>
          ) : undefined
        }
      />

      <div className="grid gap-4 min-[420px]:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <StatCard key={card.key} label={card.label} value={card.value} hint={card.hint} icon={card.icon} to={card.to} loading={card.loading} tone={card.tone} />
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)] xl:items-start">
        <Card>
          <CardHeader
            title={t('admin.recentOrgs')}
            description={t('home.orgsSubtitle')}
            icon={<BuildingIcon className="h-4 w-4" />}
            actions={<Link to="/admin/organizations" className={buttonVariants({ variant: 'link', size: 'sm' })}>{t('action.viewAll')}</Link>}
          />
          <DataTable
            columns={organizationColumns}
            data={recentOrganizations}
            rowKey={(row) => row.id}
            caption={t('admin.recentOrgs')}
            pageSize={8}
            loading={organizations.isPending}
            error={organizations.error}
            onRetry={() => void organizations.refetch()}
            empty={{ title: t('state.emptyTitle') }}
          />
        </Card>

        {canSeeFunctions && (
          <Card glass>
            <CardHeader title={t('admin.statusBreakdown', 'Catalogue status')} icon={<ActivityIcon className="h-4 w-4" />} />
            <CardBody className="space-y-4">
              {functions.isPending ? (
                <div className="space-y-4">
                  {FUNCTION_STATUSES.map((status) => (
                    <div key={status} className="space-y-2">
                      <Skeleton className="h-5 w-32 rounded-full" />
                      <Skeleton className="h-1.5 w-full rounded-full" />
                    </div>
                  ))}
                </div>
              ) : (
                breakdown.map((item) => (
                  <div key={item.status}>
                    <div className="flex items-center justify-between gap-3">
                      <FunctionStatusBadge status={item.status} />
                      <span className="text-sm tabular-nums text-content-muted">
                        <span className="font-semibold text-content-strong">{item.count}</span> · {item.share}%
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-subtle" aria-hidden="true">
                      <div className="h-full rounded-full bg-brand-gradient transition-[width] duration-slow ease-spring" style={{ width: `${item.share}%` }} />
                    </div>
                  </div>
                ))
              )}
            </CardBody>
          </Card>
        )}
      </div>

      {canSeeFunctions && (
        <Card className="mt-6">
          <CardHeader
            title={t('admin.recentFunctions')}
            description={t('home.catalogSubtitle')}
            icon={<FileTextIcon className="h-4 w-4" />}
            actions={<Link to="/admin/functions" className={buttonVariants({ variant: 'link', size: 'sm' })}>{t('action.viewAll')}</Link>}
          />
          <DataTable
            columns={functionColumns}
            data={recentFunctions}
            rowKey={(row) => row.id}
            caption={t('admin.recentFunctions')}
            pageSize={8}
            loading={functions.isPending}
            error={functions.error}
            onRetry={() => void functions.refetch()}
            empty={{ title: t('state.emptyTitle') }}
          />
        </Card>
      )}
    </div>
  );
}
