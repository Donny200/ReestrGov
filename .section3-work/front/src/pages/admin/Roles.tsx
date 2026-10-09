import React, { useMemo, useState } from 'react';
import { KeyIcon, PlusIcon, ShieldIcon, Trash2Icon, UserCheckIcon } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../../components/layout/AdminLayout';
import { Panel, PanelBody, PanelHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Field, Select, TextInput } from '../../components/ui/Field';
import { ConfirmModal, Modal } from '../../components/ui/Modal';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { SkeletonText } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/States';
import { useAsync } from '../../hooks/useAsync';
import { useI18n } from '../../contexts/I18nContext';
import {
  assignRole,
  createRole,
  deleteRole,
  getPermissions,
  getRoles,
  updateRolePermissions } from
'../../services/roleService';
import { getOrgAdmins, getModerators, getRoleAssignmentCandidates } from '../../services/staffService';
import type { Permission, RoleEntity } from '../../types/api';
import { errorMessage, fieldErrorsOf } from '../../utils/errors';
import { fullName } from '../../utils/format';

export function Roles() {
  const { t } = useI18n();
  const roles = useAsync(getRoles, []);
  const permissions = useAsync(getPermissions, []);
  const users = useAsync(
    async () => {
      const [admins, moderators, plain] = await Promise.all([getOrgAdmins(), getModerators(), getRoleAssignmentCandidates()]);
      return [...admins, ...moderators, ...plain];
    },
    []
  );

  const [createOpen, setCreateOpen] = useState(false);
  const [roleName, setRoleName] = useState('');
  const [editing, setEditing] = useState<RoleEntity | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [deleting, setDeleting] = useState<RoleEntity | null>(null);
  const [assignForm, setAssignForm] = useState({ userId: '', roleId: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const grouped = useMemo(() => {
    const map = new Map<string, Permission[]>();
    (permissions.data ?? []).forEach((item) => {
      const key = item.category ?? 'Boshqa';
      map.set(key, [...(map.get(key) ?? []), item]);
    });
    return Array.from(map.entries());
  }, [permissions.data]);

  const submitCreate = async () => {
    if (!roleName.trim()) {
      setErrors({ name: t('validation.required') });
      return;
    }
    setSaving(true);
    try {
      await createRole({ name: roleName.trim() });
      toast.success(t('toast.created'));
      setCreateOpen(false);
      setRoleName('');
      setErrors({});
      roles.reload();
    } catch (error) {
      const fields = fieldErrorsOf(error);
      setErrors(fields);
      if (Object.keys(fields).length === 0) toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const openPermissions = (role: RoleEntity) => {
    setSelectedPermissions(role.permissions.map((item) => item.id));
    setEditing(role);
  };

  const submitPermissions = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await updateRolePermissions(editing.id, { permissionIds: selectedPermissions });
      toast.success(t('toast.updated'));
      setEditing(null);
      roles.reload();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const submitDelete = async () => {
    if (!deleting) return;
    setSaving(true);
    try {
      await deleteRole(deleting.id);
      toast.success(t('toast.deleted'));
      setDeleting(null);
      roles.reload();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const submitAssign = async () => {
    const next: Record<string, string> = {};
    if (!assignForm.userId) next.userId = t('validation.required');
    if (!assignForm.roleId) next.roleId = t('validation.required');
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    try {
      await assignRole(Number(assignForm.userId), Number(assignForm.roleId));
      toast.success(t('toast.updated'));
      setAssignForm({ userId: '', roleId: '' });
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<RoleEntity>[] = [
  { key: 'id', header: t('field.id'), render: (row) => <span className="text-navy-400">#{row.id}</span> },
  {
    key: 'name',
    header: t('field.name'),
    render: (row) =>
    <span className="inline-flex items-center gap-2 font-medium text-navy-900">
          <ShieldIcon className="h-4 w-4 text-teal-600" aria-hidden="true" />
          {row.name}
        </span>

  },
  {
    key: 'permissions',
    header: t('roles.permissions'),
    render: (row) =>
    row.permissions.length === 0 ?
    <span className="text-navy-400">—</span> :

    <div className="flex flex-wrap gap-1">
            {row.permissions.slice(0, 4).map((item) =>
      <Badge key={item.id} tone="navy">
                {item.code}
              </Badge>
      )}
            {row.permissions.length > 4 && <Badge tone="teal">+{row.permissions.length - 4}</Badge>}
          </div>

  },
  {
    key: 'actions',
    header: t('field.actions'),
    className: 'text-right',
    headerClassName: 'text-right',
    render: (row) =>
    <div className="flex justify-end gap-1.5">
          <Button size="sm" variant="outline" onClick={() => openPermissions(row)} icon={<KeyIcon className="h-3.5 w-3.5" />}>
            {t('roles.editPermissions')}
          </Button>
          <Button
        size="sm"
        variant="danger"
        onClick={() => setDeleting(row)}
        icon={<Trash2Icon className="h-3.5 w-3.5" />}>
        
            {t('action.delete')}
          </Button>
        </div>

  }];


  return (
    <div>
      <PageHeader
        title={t('roles.title')}
        actions={
        <Button
          onClick={() => {
            setRoleName('');
            setErrors({});
            setCreateOpen(true);
          }}
          icon={<PlusIcon className="h-4 w-4" />}>
          
            {t('roles.createRole')}
          </Button>
        } />
      

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel>
            <PanelHeader title={t('roles.title')} description={`${(roles.data ?? []).length} ${t('home.resultsCount')}`} />
            <DataTable
              columns={columns}
              rows={roles.data ?? []}
              rowKey={(row) => row.id}
              loading={roles.loading}
              error={roles.error}
              onRetry={roles.reload}
              emptyTitle={t('state.emptyTitle')}
              caption={t('roles.title')} />
            
          </Panel>

          <Panel>
            <PanelHeader title={t('roles.assignTitle')} />
            <PanelBody>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t('staff.selectUser')} error={errors.userId} required>
                  {({ id, invalid }) =>
                  <Select
                    id={id}
                    value={assignForm.userId}
                    invalid={invalid}
                    onChange={(event) => setAssignForm({ ...assignForm, userId: event.target.value })}>
                    
                      <option value="">{t('staff.selectUser')}</option>
                      {(users.data ?? []).map((item) =>
                    <option key={item.id} value={String(item.id)}>
                          #{item.id} — {fullName(item)} ({item.email})
                        </option>
                    )}
                    </Select>
                  }
                </Field>
                <Field label={t('field.role')} error={errors.roleId} required>
                  {({ id, invalid }) =>
                  <Select
                    id={id}
                    value={assignForm.roleId}
                    invalid={invalid}
                    onChange={(event) => setAssignForm({ ...assignForm, roleId: event.target.value })}>
                    
                      <option value="">{t('field.role')}</option>
                      {(roles.data ?? []).map((item) =>
                    <option key={item.id} value={String(item.id)}>
                          {item.name}
                        </option>
                    )}
                    </Select>
                  }
                </Field>
              </div>
              <Button className="mt-4" onClick={submitAssign} loading={saving} icon={<UserCheckIcon className="h-4 w-4" />}>
                {t('action.assign')}
              </Button>
            </PanelBody>
          </Panel>
        </div>

        <Panel className="h-fit">
          <PanelHeader title={t('roles.permissionsPanel')} description={`${(permissions.data ?? []).length}`} />
          <PanelBody className="max-h-[520px] overflow-y-auto">
            {permissions.loading ?
            <SkeletonText lines={8} /> :
            permissions.error ?
            <ErrorState error={permissions.error} onRetry={permissions.reload} /> :

            <div className="space-y-5">
                {grouped.map(([category, items]) =>
              <div key={category}>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-navy-400">{category}</p>
                    <ul className="mt-2 space-y-1.5">
                      {items.map((item) =>
                  <li key={item.id} className="rounded-lg border border-navy-100 px-3 py-2">
                          <p className="text-[13px] font-medium text-navy-900">{item.name}</p>
                          <p className="font-mono text-[11px] text-navy-400">{item.code}</p>
                        </li>
                  )}
                    </ul>
                  </div>
              )}
              </div>
            }
          </PanelBody>
        </Panel>
      </div>

      <Modal
        open={createOpen}
        title={t('roles.createRole')}
        onClose={() => setCreateOpen(false)}
        size="sm"
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
        
        <Field
          label={t('field.name')}
          error={errors.name}
          hint="Masalan: CATALOG_EDITOR — ruxsatlar keyin biriktiriladi"
          required>
          
          {({ id, invalid }) =>
          <TextInput id={id} value={roleName} invalid={invalid} onChange={(event) => setRoleName(event.target.value)} />
          }
        </Field>
      </Modal>

      <Modal
        open={Boolean(editing)}
        title={t('roles.editPermissions')}
        description={editing?.name}
        onClose={() => setEditing(null)}
        size="lg"
        footer={
        <>
            <Button variant="outline" onClick={() => setEditing(null)} disabled={saving}>
              {t('action.cancel')}
            </Button>
            <Button onClick={submitPermissions} loading={saving}>
              {t('action.save')}
            </Button>
          </>
        }>
        
        <div className="space-y-5">
          {grouped.map(([category, items]) =>
          <fieldset key={category}>
              <legend className="text-[11px] font-semibold uppercase tracking-wide text-navy-400">{category}</legend>
              <div className="mt-2 grid gap-1 sm:grid-cols-2">
                {items.map((item) =>
              <label
                key={item.id}
                className="flex cursor-pointer items-start gap-2.5 rounded-lg px-2.5 py-2 text-sm text-navy-700 transition-colors hover:bg-navy-50">
                
                    <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-navy-300 text-teal-600 focus:ring-teal-500"
                  checked={selectedPermissions.includes(item.id)}
                  onChange={() =>
                  setSelectedPermissions((prev) =>
                  prev.includes(item.id) ? prev.filter((value) => value !== item.id) : [...prev, item.id]
                  )
                  } />
                
                    <span>
                      <span className="block leading-tight">{item.name}</span>
                      <span className="font-mono text-[11px] text-navy-400">{item.code}</span>
                    </span>
                  </label>
              )}
              </div>
            </fieldset>
          )}
        </div>
      </Modal>

      <ConfirmModal
        open={Boolean(deleting)}
        title={t('action.delete')}
        message={`${deleting?.name ?? ''} — ${t('roles.deleteConfirm')}`}
        confirmLabel={t('action.delete')}
        cancelLabel={t('action.cancel')}
        loading={saving}
        onConfirm={submitDelete}
        onClose={() => setDeleting(null)} />
      
    </div>);

}
