import React, { useMemo, useState } from 'react';
import { ArrowUpCircleIcon, PencilIcon, PlusIcon, PowerOffIcon, SearchIcon } from 'lucide-react';
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
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import { getOrganizations } from '../../services/organizationService';
import {
  createModerator,
  deactivateModerator,
  getModerators,
  getModeratorCandidates,
  promoteModerator,
  updateModerator } from
'../../services/staffService';
import type { StaffUser } from '../../types/api';
import { errorMessage, fieldErrorsOf } from '../../utils/errors';
import { fullName } from '../../utils/format';

interface CreateForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  organizationIds: number[];
}

const emptyCreate: CreateForm = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  phone: '',
  organizationIds: []
};

export function Moderators() {
  const { t } = useI18n();
  const { user, isOrgAdmin } = useAuth();
  const moderators = useAsync(getModerators, []);
  const organizations = useAsync(getOrganizations, []);
  const promotable = useAsync(getModeratorCandidates, []);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [orgFilter, setOrgFilter] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [editing, setEditing] = useState<StaffUser | null>(null);
  const [deactivating, setDeactivating] = useState<StaffUser | null>(null);
  const [createForm, setCreateForm] = useState<CreateForm>(emptyCreate);
  const [promoteForm, setPromoteForm] = useState<{userId: string;organizationIds: number[];}>({
    userId: '',
    organizationIds: []
  });
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    organizationIds: [] as number[],
    enabled: true
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const allOrgs = organizations.data ?? [];
  const assignableOrgs = useMemo(
    () =>
    allOrgs.
    filter((item) => item.enabled).
    filter((item) => isOrgAdmin && user ? user.organizationIds.includes(item.id) : true),
    [allOrgs, isOrgAdmin, user]
  );
  const orgName = useMemo(() => {
    const map = new Map<number, string>();
    allOrgs.forEach((item) => map.set(item.id, item.name));
    return map;
  }, [allOrgs]);

  const orgOptions = assignableOrgs.map((item) => ({ value: item.id, label: `#${item.id} — ${item.name}` }));

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (moderators.data ?? []).filter((item) => {
      if (status === 'active' && !item.enabled) return false;
      if (status === 'inactive' && item.enabled) return false;
      if (orgFilter && !item.organizationIds.includes(Number(orgFilter))) return false;
      if (!term) return true;
      return fullName(item).toLowerCase().includes(term) || item.email.toLowerCase().includes(term);
    });
  }, [moderators.data, search, status, orgFilter]);

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
    if (createForm.organizationIds.length === 0) next.organizationIds = t('validation.selectOrg');
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    try {
      await createModerator({
        firstName: createForm.firstName.trim(),
        lastName: createForm.lastName.trim(),
        email: createForm.email.trim(),
        password: createForm.password,
        phone: createForm.phone.trim() || undefined,
        organizationIds: createForm.organizationIds
      });
      toast.success(t('toast.created'));
      setCreateOpen(false);
      setCreateForm(emptyCreate);
      moderators.reload();
    } catch (error) {
      handleError(error);
    } finally {
      setSaving(false);
    }
  };

  const submitPromote = async () => {
    const next: Record<string, string> = {};
    if (!promoteForm.userId) next.userId = t('validation.required');
    if (promoteForm.organizationIds.length === 0) next.organizationIds = t('validation.selectOrg');
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    try {
      await promoteModerator({
        userId: Number(promoteForm.userId),
        organizationIds: promoteForm.organizationIds
      });
      toast.success(t('toast.updated'));
      setPromoteOpen(false);
      setPromoteForm({ userId: '', organizationIds: [] });
      moderators.reload();
      promotable.reload();
    } catch (error) {
      handleError(error);
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (moderator: StaffUser) => {
    setEditForm({
      firstName: moderator.firstName,
      lastName: moderator.lastName,
      phone: moderator.phone ?? '',
      organizationIds: [...moderator.organizationIds],
      enabled: moderator.enabled
    });
    setErrors({});
    setEditing(moderator);
  };

  const submitEdit = async () => {
    if (!editing) return;
    if (editForm.organizationIds.length === 0) {
      setErrors({ organizationIds: t('validation.selectOrg') });
      return;
    }
    setSaving(true);
    try {
      // organizationIds is mandatory and REPLACES the full assigned list.
      await updateModerator(editing.id, {
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
        phone: editForm.phone.trim(),
        organizationIds: editForm.organizationIds,
        enabled: editForm.enabled
      });
      toast.success(t('toast.updated'));
      setEditing(null);
      moderators.reload();
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
      await deactivateModerator(deactivating.id);
      toast.success(t('toast.deactivated'));
      setDeactivating(null);
      moderators.reload();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<StaffUser>[] = [
  { key: 'id', header: t('field.id'), render: (row) => <span className="text-navy-400">#{row.id}</span> },
  {
    key: 'name',
    header: t('field.fullName'),
    render: (row) => <span className="font-medium text-navy-900">{fullName(row)}</span>
  },
  { key: 'email', header: t('field.email'), render: (row) => <span className="text-navy-600">{row.email}</span> },
  { key: 'phone', header: t('field.phone'), render: (row) => <span className="text-navy-500">{row.phone ?? '—'}</span> },
  {
    key: 'organizations',
    header: t('field.organizations'),
    render: (row) =>
    <div className="flex flex-wrap gap-1">
          {row.organizationIds.length === 0 ?
      <span className="text-navy-400">—</span> :

      row.organizationIds.map((id) =>
      <Badge key={id} tone="teal">
                #{id} {orgName.get(id) ?? ''}
              </Badge>
      )
      }
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
          <Button size="sm" variant="outline" onClick={() => openEdit(row)} icon={<PencilIcon className="h-3.5 w-3.5" />}>
            {t('action.edit')}
          </Button>
          {row.enabled &&
      <Button
        size="sm"
        variant="danger"
        onClick={() => setDeactivating(row)}
        icon={<PowerOffIcon className="h-3.5 w-3.5" />}>
        
              {t('action.deactivate')}
            </Button>
      }
        </div>

  }];


  return (
    <div>
      <PageHeader
        title={t('staff.moderatorsTitle')}
        description={t('staff.orgsMandatory')}
        actions={
        <>
            <Button
            variant="outline"
            onClick={() => {
              setErrors({});
              setPromoteOpen(true);
            }}
            icon={<ArrowUpCircleIcon className="h-4 w-4" />}>
            
              {t('action.promote')}
            </Button>
            <Button
            onClick={() => {
              setCreateForm(emptyCreate);
              setErrors({});
              setCreateOpen(true);
            }}
            icon={<PlusIcon className="h-4 w-4" />}>
            
              {t('staff.createModerator')}
            </Button>
          </>
        } />
      

      <Panel>
        <PanelHeader
          title={`${rows.length} ${t('home.resultsCount')}`}
          actions={
          <div className="flex flex-col gap-2 sm:flex-row">
              <label className="relative">
                <span className="sr-only">{t('action.search')}</span>
                <SearchIcon
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300"
                aria-hidden="true" />
              
                <TextInput
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t('action.search')}
                className="h-10 w-full pl-9 sm:w-52" />
              
              </label>
              <Select value={orgFilter} onChange={(event) => setOrgFilter(event.target.value)} className="h-10 sm:w-48">
                <option value="">
                  {t('field.organization')} — {t('status.all')}
                </option>
                {assignableOrgs.map((item) =>
              <option key={item.id} value={String(item.id)}>
                    {item.name}
                  </option>
              )}
              </Select>
              <Select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 sm:w-36">
                <option value="">{t('status.all')}</option>
                <option value="active">{t('status.active')}</option>
                <option value="inactive">{t('status.inactive')}</option>
              </Select>
            </div>
          } />
        
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.id}
          loading={moderators.loading}
          error={moderators.error}
          onRetry={moderators.reload}
          emptyTitle={t('state.emptyTitle')}
          emptyDescription={t('state.emptyText')}
          caption={t('staff.moderatorsTitle')} />
        
      </Panel>

      <Modal
        open={createOpen}
        title={t('staff.createModerator')}
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
          <Field label={t('field.email')} error={errors.email} required className="sm:col-span-2">
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
          <Field label={t('field.phone')} error={errors.phone} hint={t('field.optional')}>
            {({ id, invalid }) =>
            <TextInput
              id={id}
              value={createForm.phone}
              invalid={invalid}
              placeholder="+998 90 000 00 00"
              onChange={(event) => setCreateForm({ ...createForm, phone: event.target.value })} />

            }
          </Field>
          <CheckboxList
            className="sm:col-span-2"
            legend={t('field.organizations')}
            options={orgOptions}
            selected={createForm.organizationIds}
            onChange={(values) => setCreateForm({ ...createForm, organizationIds: values })}
            error={errors.organizationIds}
            hint={t('staff.orgsMandatory')}
            columns={2} />
          
        </div>
      </Modal>

      <Modal
        open={promoteOpen}
        title={t('staff.promoteTitle')}
        onClose={() => setPromoteOpen(false)}
        footer={
        <>
            <Button variant="outline" onClick={() => setPromoteOpen(false)} disabled={saving}>
              {t('action.cancel')}
            </Button>
            <Button onClick={submitPromote} loading={saving}>
              {t('action.promote')}
            </Button>
          </>
        }>
        
        <div className="space-y-4">
          <Field label={t('staff.selectUser')} error={errors.userId} required>
            {({ id, invalid }) =>
            <Select
              id={id}
              value={promoteForm.userId}
              invalid={invalid}
              onChange={(event) => setPromoteForm({ ...promoteForm, userId: event.target.value })}>
              
                <option value="">{t('staff.selectUser')}</option>
                {(promotable.data ?? []).map((item) =>
              <option key={item.id} value={String(item.id)}>
                    #{item.id} — {fullName(item)} ({item.email})
                  </option>
              )}
              </Select>
            }
          </Field>
          <CheckboxList
            legend={t('field.organizations')}
            options={orgOptions}
            selected={promoteForm.organizationIds}
            onChange={(values) => setPromoteForm({ ...promoteForm, organizationIds: values })}
            error={errors.organizationIds}
            columns={2} />
          
        </div>
      </Modal>

      <Modal
        open={Boolean(editing)}
        title={t('action.edit')}
        description={editing ? `#${editing.id} · ${editing.email}` : undefined}
        onClose={() => setEditing(null)}
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
        
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('field.firstName')} error={errors.firstName}>
            {({ id, invalid }) =>
            <TextInput
              id={id}
              value={editForm.firstName}
              invalid={invalid}
              onChange={(event) => setEditForm({ ...editForm, firstName: event.target.value })} />

            }
          </Field>
          <Field label={t('field.lastName')} error={errors.lastName}>
            {({ id, invalid }) =>
            <TextInput
              id={id}
              value={editForm.lastName}
              invalid={invalid}
              onChange={(event) => setEditForm({ ...editForm, lastName: event.target.value })} />

            }
          </Field>
          <Field label={t('field.phone')} error={errors.phone} className="sm:col-span-2">
            {({ id, invalid }) =>
            <TextInput
              id={id}
              value={editForm.phone}
              invalid={invalid}
              onChange={(event) => setEditForm({ ...editForm, phone: event.target.value })} />

            }
          </Field>
          <CheckboxList
            className="sm:col-span-2"
            legend={t('field.organizations')}
            options={orgOptions}
            selected={editForm.organizationIds}
            onChange={(values) => setEditForm({ ...editForm, organizationIds: values })}
            error={errors.organizationIds}
            hint={t('staff.orgsMandatory')}
            columns={2} />
          
          <label className="flex items-center gap-2.5 text-sm text-navy-700 sm:col-span-2">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-navy-300 text-teal-600 focus:ring-teal-500"
              checked={editForm.enabled}
              onChange={(event) => setEditForm({ ...editForm, enabled: event.target.checked })} />
            
            {t('field.enabled')}
          </label>
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
