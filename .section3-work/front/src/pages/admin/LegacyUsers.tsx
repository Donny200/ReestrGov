import React, { useMemo, useState } from 'react';
import { AlertTriangleIcon, PencilIcon, PlusIcon, PowerOffIcon, SearchIcon } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../../components/layout/AdminLayout';
import { Panel, PanelHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Field, Select, TextInput } from '../../components/ui/Field';
import { CheckboxList } from '../../components/ui/CheckboxList';
import { ConfirmModal, Modal } from '../../components/ui/Modal';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { Badge, StatusBadge } from '../../components/ui/Badge';
import { useAsync } from '../../hooks/useAsync';
import { useI18n } from '../../contexts/I18nContext';
import { getOrganizations } from '../../services/organizationService';
import { getRoles } from '../../services/roleService';
import {
  createLegacyUser,
  deactivateLegacyUser,
  getLegacyUsers,
  updateLegacyUser } from
'../../services/legacyUserService';
import type { LegacyUser } from '../../types/api';
import { errorMessage, fieldErrorsOf } from '../../utils/errors';
import { fullName, roleLabel } from '../../utils/format';

interface CreateForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  roleId: string;
  organizations: number[];
}

const emptyCreate: CreateForm = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  phone: '',
  roleId: '',
  organizations: []
};

/**
 * Legacy /api/user CRUD. GET /api/user/profile is broken and is NOT used here.
 * Passwords are never rendered — only sent on create.
 */
export function LegacyUsers() {
  const { t } = useI18n();
  const users = useAsync(getLegacyUsers, []);
  const organizations = useAsync(getOrganizations, []);
  const roles = useAsync(getRoles, []);

  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<LegacyUser | null>(null);
  const [deactivating, setDeactivating] = useState<LegacyUser | null>(null);
  const [createForm, setCreateForm] = useState<CreateForm>(emptyCreate);
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', email: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const orgOptions = (organizations.data ?? []).map((item) => ({ value: item.id, label: `#${item.id} — ${item.name}` }));

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users.data ?? [];
    return (users.data ?? []).filter(
      (item) => fullName(item).toLowerCase().includes(term) || item.email.toLowerCase().includes(term)
    );
  }, [users.data, search]);

  const handleError = (error: unknown) => {
    const fields = fieldErrorsOf(error);
    setErrors(fields);
    if (Object.keys(fields).length === 0) toast.error(errorMessage(error));
  };

  const submitCreate = async () => {
    const next: Record<string, string> = {};
    if (!createForm.firstName.trim()) next.firstName = t('validation.required');
    if (!createForm.lastName.trim()) next.lastName = t('validation.required');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.email.trim())) next.email = t('validation.email');
    if (createForm.password.length < 8) next.password = t('validation.minPassword');
    if (!createForm.roleId) next.roleId = t('validation.required');
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    try {
      await createLegacyUser({
        firstName: createForm.firstName.trim(),
        lastName: createForm.lastName.trim(),
        email: createForm.email.trim(),
        password: createForm.password,
        phone: createForm.phone.trim(),
        roleId: Number(createForm.roleId),
        organizationIds: createForm.organizations
      });
      toast.success(t('toast.created'));
      setCreateOpen(false);
      setCreateForm(emptyCreate);
      users.reload();
    } catch (error) {
      handleError(error);
    } finally {
      setSaving(false);
    }
  };

  const submitEdit = async () => {
    if (!editing) return;
    const next: Record<string, string> = {};
    if (!editForm.firstName.trim()) next.firstName = t('validation.required');
    if (!editForm.lastName.trim()) next.lastName = t('validation.required');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email.trim())) next.email = t('validation.email');
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    try {
      await updateLegacyUser(editing.id, {
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
        email: editForm.email.trim()
      });
      toast.success(t('toast.updated'));
      setEditing(null);
      users.reload();
    } catch (error) {
      handleError(error);
    } finally {
      setSaving(false);
    }
  };

  const submitDeactivate = async () => {
    if (!deactivating) return;
    setSaving(true);
    try {
      await deactivateLegacyUser(deactivating.id);
      toast.success(t('toast.deactivated'));
      setDeactivating(null);
      users.reload();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<LegacyUser>[] = [
  { key: 'id', header: t('field.id'), render: (row) => <span className="text-navy-400">#{row.id}</span> },
  {
    key: 'name',
    header: t('field.fullName'),
    render: (row) => <span className="font-medium text-navy-900">{fullName(row)}</span>
  },
  { key: 'email', header: t('field.email'), render: (row) => <span className="text-navy-600">{row.email}</span> },
  { key: 'phone', header: t('field.phone'), render: (row) => <span className="text-navy-500">{row.phone ?? '—'}</span> },
  { key: 'role', header: t('field.role'), render: (row) => <Badge tone="navy">{roleLabel(row.role)}</Badge> },
  {
    key: 'organizations',
    header: t('field.organizations'),
    render: (row) =>
    row.organizations.length === 0 ?
    <span className="text-navy-400">—</span> :

    <div className="flex flex-wrap gap-1">
            {row.organizations.map((orgId) =>
      <Badge key={orgId} tone="teal">
                #{orgId}
              </Badge>
      )}
          </div>

  },
  { key: 'status', header: t('field.status'), render: (row) => <StatusBadge enabled={row.enabled} /> },
  {
    key: 'actions',
    header: t('field.actions'),
    className: 'text-right',
    headerClassName: 'text-right',
    render: (row) =>
    <div className="flex justify-end gap-1.5">
          <Button
        size="sm"
        variant="outline"
        onClick={() => {
          setEditForm({ firstName: row.firstName, lastName: row.lastName, email: row.email });
          setErrors({});
          setEditing(row);
        }}
        icon={<PencilIcon className="h-3.5 w-3.5" />}>
        
            {t('action.edit')}
          </Button>
          <Button size="sm" variant="danger" onClick={() => setDeactivating(row)} icon={<PowerOffIcon className="h-3.5 w-3.5" />}>
            {t('action.deactivate')}
          </Button>
        </div>

  }];


  return (
    <div>
      <PageHeader
        title={t('legacy.title')}
        description={t('legacy.notice')}
        badge={<Badge tone="amber">{t('legacy.badge')}</Badge>}
        actions={
        <Button
          onClick={() => {
            setCreateForm(emptyCreate);
            setErrors({});
            setCreateOpen(true);
          }}
          icon={<PlusIcon className="h-4 w-4" />}>
          
            {t('action.create')}
          </Button>
        } />
      

      <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] leading-relaxed text-amber-800">
        <AlertTriangleIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span>
          {t('legacy.notice')} <span className="font-semibold">{t('legacy.updateNotice')}</span>
        </span>
      </div>

      <Panel>
        <PanelHeader
          title={`${rows.length} ${t('home.resultsCount')}`}
          actions={
          <label className="relative">
              <span className="sr-only">{t('action.search')}</span>
              <SearchIcon
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300"
              aria-hidden="true" />
            
              <TextInput
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('action.search')}
              className="h-10 w-full pl-9 sm:w-56" />
            
            </label>
          } />
        
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.id}
          loading={users.loading}
          error={users.error}
          onRetry={users.reload}
          emptyTitle={t('state.emptyTitle')}
          emptyDescription={t('state.emptyText')}
          caption={t('legacy.title')} />
        
      </Panel>

      <Modal
        open={createOpen}
        title={`${t('action.create')} — ${t('legacy.badge')}`}
        onClose={() => setCreateOpen(false)}
        footer={
        <>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={saving}>
              {t('action.cancel')}
            </Button>
            <Button onClick={submitCreate} loading={saving}>
              {t('action.create')}
            </Button>
          </>
        }>
        
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('field.firstName')} error={errors.firstName} required>
            {({ id, invalid }) =>
            <TextInput
              id={id}
              value={createForm.firstName}
              invalid={invalid}
              onChange={(event) => setCreateForm({ ...createForm, firstName: event.target.value })} />

            }
          </Field>
          <Field label={t('field.lastName')} error={errors.lastName} required>
            {({ id, invalid }) =>
            <TextInput
              id={id}
              value={createForm.lastName}
              invalid={invalid}
              onChange={(event) => setCreateForm({ ...createForm, lastName: event.target.value })} />

            }
          </Field>
          <Field label={t('field.email')} error={errors.email} required>
            {({ id, invalid }) =>
            <TextInput
              id={id}
              type="email"
              value={createForm.email}
              invalid={invalid}
              onChange={(event) => setCreateForm({ ...createForm, email: event.target.value })} />

            }
          </Field>
          <Field label={t('field.password')} error={errors.password} hint={t('security.passwordRule')} required>
            {({ id, invalid }) =>
            <TextInput
              id={id}
              type="password"
              autoComplete="new-password"
              value={createForm.password}
              invalid={invalid}
              onChange={(event) => setCreateForm({ ...createForm, password: event.target.value })} />

            }
          </Field>
          <Field label={t('field.phone')} error={errors.phone}>
            {({ id, invalid }) =>
            <TextInput
              id={id}
              value={createForm.phone}
              invalid={invalid}
              placeholder="+998 90 000 00 00"
              onChange={(event) => setCreateForm({ ...createForm, phone: event.target.value })} />

            }
          </Field>
          <Field label={t('field.role')} error={errors.roleId} required>
            {({ id, invalid }) =>
            <Select
              id={id}
              value={createForm.roleId}
              invalid={invalid}
              onChange={(event) => setCreateForm({ ...createForm, roleId: event.target.value })}>
              
                <option value="">{t('field.role')}</option>
                {(roles.data ?? []).map((role) =>
              <option key={role.id} value={role.id}>
                    {roleLabel(role.name)}
                  </option>
              )}
              </Select>
            }
          </Field>
          <CheckboxList
            className="sm:col-span-2"
            legend={t('field.organizations')}
            options={orgOptions}
            selected={createForm.organizations}
            onChange={(values) => setCreateForm({ ...createForm, organizations: values })}
            columns={2} />
          
        </div>
      </Modal>

      <Modal
        open={Boolean(editing)}
        title={t('action.edit')}
        description={t('legacy.updateNotice')}
        onClose={() => setEditing(null)}
        size="sm"
        footer={
        <>
            <Button variant="outline" onClick={() => setEditing(null)} disabled={saving}>
              {t('action.cancel')}
            </Button>
            <Button onClick={submitEdit} loading={saving}>
              {t('action.save')}
            </Button>
          </>
        }>
        
        <div className="space-y-4">
          <Field label={t('field.firstName')} error={errors.firstName} required>
            {({ id, invalid }) =>
            <TextInput
              id={id}
              value={editForm.firstName}
              invalid={invalid}
              onChange={(event) => setEditForm({ ...editForm, firstName: event.target.value })} />

            }
          </Field>
          <Field label={t('field.lastName')} error={errors.lastName} required>
            {({ id, invalid }) =>
            <TextInput
              id={id}
              value={editForm.lastName}
              invalid={invalid}
              onChange={(event) => setEditForm({ ...editForm, lastName: event.target.value })} />

            }
          </Field>
          <Field label={t('field.email')} error={errors.email} required>
            {({ id, invalid }) =>
            <TextInput
              id={id}
              type="email"
              value={editForm.email}
              invalid={invalid}
              onChange={(event) => setEditForm({ ...editForm, email: event.target.value })} />

            }
          </Field>
        </div>
      </Modal>

      <ConfirmModal
        open={Boolean(deactivating)}
        title={t('action.deactivate')}
        message={`${deactivating ? fullName(deactivating) : ''} — ${t('staff.deactivateConfirm')}`}
        confirmLabel={t('action.deactivate')}
        cancelLabel={t('action.cancel')}
        loading={saving}
        onConfirm={submitDeactivate}
        onClose={() => setDeactivating(null)} />
      
    </div>);

}
