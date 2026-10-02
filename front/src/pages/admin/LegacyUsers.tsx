import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { AlertTriangleIcon, MoreHorizontalIcon, PencilIcon, PlusIcon, PowerOffIcon } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { SearchInput } from '../../components/ui/SearchInput';
import { Toolbar } from '../../components/ui/Toolbar';
import { DataTable } from '../../components/ui/DataTable';
import { Avatar } from '../../components/ui/Avatar';
import { Badge, StatusBadge } from '../../components/ui/Badge';
import { ConfirmModal } from '../../components/ui/Modal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/DropdownMenu';
import { LegacyUserCreateDialog, LegacyUserEditDialog } from '../../features/legacyUsers/LegacyUserDialogs';
import { useDeactivateLegacyUser, useLegacyUsers } from '../../features/legacyUsers/queries';
import { useOrganizations } from '../../features/organizations/queries';
import { useRoles } from '../../features/roles/queries';
import { useI18n } from '../../contexts/i18n';
import type { LegacyUser } from '../../types/api';
import { errorMessage } from '../../utils/errors';
import { statusFilterOptions, type StatusFilter } from '../../utils/filters';
import { fullName, roleLabel } from '../../utils/format';

type DialogState = { mode: 'create' } | { mode: 'edit'; user: LegacyUser } | null;

function matchesFilters(item: LegacyUser, term: string, status: StatusFilter, role: string): boolean {
  if (status === 'active' && !item.enabled) return false;
  if (status === 'inactive' && item.enabled) return false;
  if (role && item.role !== role) return false;
  return !term || fullName(item).toLowerCase().includes(term) || item.email.toLowerCase().includes(term);
}

export function LegacyUsers() {
  const { t } = useI18n();
  const users = useLegacyUsers();
  const organizations = useOrganizations();
  const roles = useRoles();
  const deactivate = useDeactivateLegacyUser();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('');
  const [role, setRole] = useState('');
  const [dialog, setDialog] = useState<DialogState>(null);
  const [deactivating, setDeactivating] = useState<LegacyUser | null>(null);

  const organizationNames = useMemo(
    () => new Map((organizations.data ?? []).map((item) => [item.id, item.name])),
    [organizations.data],
  );

  const roleOptions = useMemo(() => Array.from(new Set((users.data ?? []).map((item) => item.role))).sort(), [users.data]);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (users.data ?? []).filter((item) => matchesFilters(item, term, status, role));
  }, [users.data, search, status, role]);

  const confirmDeactivate = () => {
    if (!deactivating) return;
    deactivate.mutate(deactivating.id, {
      onSuccess: () => {
        toast.success(t('toast.deactivated'));
        setDeactivating(null);
      },
      onError: (error) => toast.error(errorMessage(error, t)),
    });
  };

  const columns = useMemo<ColumnDef<LegacyUser>[]>(
    () => [
      {
        accessorKey: 'id',
        header: t('field.id'),
        meta: { hideBelow: 'xl', mobileHidden: true },
        cell: ({ row }) => <span className="tabular-nums text-content-subtle">#{row.original.id}</span>,
      },
      {
        id: 'name',
        header: t('field.fullName'),
        accessorFn: (row) => fullName(row),
        cell: ({ row }) => (
          <div className="flex min-w-0 items-center gap-3">
            <Avatar user={row.original} size="sm" />
            <span className="min-w-0">
              <span className="block truncate font-medium text-content-strong">{fullName(row.original)}</span>
              <span className="block truncate text-xs text-content-muted">{row.original.email}</span>
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'phone',
        header: t('field.phone'),
        meta: { hideBelow: 'xl' },
        cell: ({ row }) => <span className="tabular-nums text-content-muted">{row.original.phone ?? '—'}</span>,
      },
      {
        accessorKey: 'role',
        header: t('field.role'),
        meta: { hideBelow: 'md' },
        cell: ({ row }) => <Badge tone="brand">{roleLabel(row.original.role, t)}</Badge>,
      },
      {
        id: 'organizations',
        header: t('field.organizations'),
        enableSorting: false,
        meta: { hideBelow: 'lg' },
        cell: ({ row }) =>
          row.original.organizations.length === 0 ? (
            <span className="text-content-subtle">—</span>
          ) : (
            <div className="flex flex-wrap gap-1">
              {row.original.organizations.map((id) => (
                <Badge key={id} tone="neutral">#{id} {organizationNames.get(id) ?? ''}</Badge>
              ))}
            </div>
          ),
      },
      {
        accessorKey: 'enabled',
        header: t('field.status'),
        cell: ({ row }) => <StatusBadge enabled={row.original.enabled} />,
      },
      {
        id: 'actions',
        header: t('field.actions'),
        enableSorting: false,
        meta: { align: 'right', mobileHidden: true },
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="iconSm" aria-label={`${t('field.actions')}: ${fullName(row.original)}`}>
                <MoreHorizontalIcon aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={() => setDialog({ mode: 'edit', user: row.original })}>
                <PencilIcon />
                {t('action.edit')}
              </DropdownMenuItem>
              {row.original.enabled && (
                <DropdownMenuItem destructive onSelect={() => setDeactivating(row.original)}>
                  <PowerOffIcon />
                  {t('action.deactivate')}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [t, organizationNames],
  );

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow={t('nav.admin')}
        title={t('legacy.title')}
        description={t('legacy.notice')}
        badge={<Badge tone="warning" dot>{t('legacy.badge')}</Badge>}
        actions={<Button icon={<PlusIcon />} onClick={() => setDialog({ mode: 'create' })}>{t('action.create')}</Button>}
      />

      <div className="mb-6 flex items-start gap-3 rounded-surface border border-warning/25 bg-warning/10 px-4 py-4 text-sm leading-relaxed text-content sm:px-5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-warning/15 text-warning" aria-hidden="true">
          <AlertTriangleIcon className="h-4 w-4" />
        </span>
        <span>
          {t('legacy.notice')} <span className="font-semibold">{t('legacy.updateNotice')}</span>
        </span>
      </div>

      <Card>
        <Toolbar summary={`${rows.length} ${t('home.resultsCount')}`}>
          <SearchInput value={search} onChange={setSearch} label={t('action.search')} className="sm:w-64" />
          <Select
            value={role}
            aria-label={t('field.role')}
            onValueChange={setRole}
            className="sm:w-48"
            options={[
              { value: '', label: `${t('field.role')} — ${t('status.all')}` },
              ...roleOptions.map((item) => ({ value: item, label: roleLabel(item, t) })),
            ]}
          />
          <Select
            value={status}
            aria-label={t('field.status')}
            onValueChange={(next) => setStatus(next as StatusFilter)}
            className="sm:w-36"
            options={statusFilterOptions(t)}
          />
        </Toolbar>
        <DataTable
          columns={columns}
          data={rows}
          rowKey={(row) => row.id}
          caption={t('legacy.title')}
          loading={users.isPending}
          error={users.error}
          onRetry={() => void users.refetch()}
          pageSize={25}
          initialSorting={[{ id: 'name', desc: false }]}
          empty={{ title: t('state.emptyTitle'), description: t('state.emptyText') }}
        />
      </Card>

      <LegacyUserCreateDialog
        open={dialog?.mode === 'create'}
        roles={roles.data ?? []}
        organizations={organizations.data ?? []}
        onClose={() => setDialog(null)}
      />
      <LegacyUserEditDialog open={dialog?.mode === 'edit'} user={dialog?.mode === 'edit' ? dialog.user : null} onClose={() => setDialog(null)} />
      <ConfirmModal
        open={Boolean(deactivating)}
        title={t('action.deactivate')}
        message={`${deactivating ? fullName(deactivating) : ''} — ${t('staff.deactivateConfirm')}`}
        confirmLabel={t('action.deactivate')}
        cancelLabel={t('action.cancel')}
        loading={deactivate.isPending}
        onConfirm={confirmDeactivate}
        onClose={() => setDeactivating(null)}
      />
    </div>
  );
}
