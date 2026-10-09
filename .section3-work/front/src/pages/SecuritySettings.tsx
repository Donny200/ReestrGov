import React, { useState } from 'react';
import { KeyRoundIcon, ShieldCheckIcon } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../components/layout/AdminLayout';
import { Panel, PanelBody, PanelHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Field, TextInput } from '../components/ui/Field';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { changePassword } from '../services/authService';
import { errorMessage, fieldErrorsOf } from '../utils/errors';
import { fullName, roleLabel } from '../utils/format';

/** NOTE: /api/user/profile is never called — account data comes from GET /api/auth/me. */
export function SecuritySettings() {
  const { t } = useI18n();
  const { user, refreshUser } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!currentPassword) next.currentPassword = t('validation.required');
    if (newPassword.length < 8 || newPassword.length > 100) next.newPassword = t('security.passwordRule');
    if (newPassword !== repeatPassword) next.repeatPassword = t('security.mismatch');
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      await changePassword({ currentPassword, newPassword });
      await refreshUser();
      toast.success(t('security.success'));
      setCurrentPassword('');
      setNewPassword('');
      setRepeatPassword('');
    } catch (error) {
      const fields = fieldErrorsOf(error);
      setErrors(fields);
      if (Object.keys(fields).length === 0) toast.error(errorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader title={t('security.title')} description={t('security.passwordRule')} />

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <PanelHeader title={t('security.changePassword')} />
          <PanelBody>
            <form className="max-w-md space-y-4" onSubmit={handleSubmit} noValidate>
              <Field label={t('security.currentPassword')} error={errors.currentPassword} required>
                {({ id, invalid, describedBy }) =>
                <TextInput
                  id={id}
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  invalid={invalid}
                  aria-describedby={describedBy}
                  onChange={(event) => setCurrentPassword(event.target.value)} />

                }
              </Field>
              <Field
                label={t('security.newPassword')}
                error={errors.newPassword}
                hint={t('security.passwordRule')}
                required>
                
                {({ id, invalid, describedBy }) =>
                <TextInput
                  id={id}
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  invalid={invalid}
                  aria-describedby={describedBy}
                  onChange={(event) => setNewPassword(event.target.value)} />

                }
              </Field>
              <Field label={t('security.repeatPassword')} error={errors.repeatPassword} required>
                {({ id, invalid, describedBy }) =>
                <TextInput
                  id={id}
                  type="password"
                  autoComplete="new-password"
                  value={repeatPassword}
                  invalid={invalid}
                  aria-describedby={describedBy}
                  onChange={(event) => setRepeatPassword(event.target.value)} />

                }
              </Field>
              <Button type="submit" loading={submitting} icon={<KeyRoundIcon className="h-4 w-4" />}>
                {t('action.save')}
              </Button>
            </form>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader title={t('admin.welcome')} />
          <PanelBody className="space-y-3 text-sm">
            {user ?
            <>
                <div className="flex items-center gap-2 text-teal-700">
                  <ShieldCheckIcon className="h-4 w-4" aria-hidden="true" />
                  <span className="text-[13px] font-medium">{roleLabel(user.role)}</span>
                </div>
                <dl className="space-y-2 text-[13px]">
                  <div>
                    <dt className="text-navy-400">{t('field.fullName')}</dt>
                    <dd className="font-medium text-navy-900">{fullName(user)}</dd>
                  </div>
                  <div>
                    <dt className="text-navy-400">{t('field.email')}</dt>
                    <dd className="font-medium text-navy-900">{user.email}</dd>
                  </div>
                  <div>
                    <dt className="text-navy-400">{t('field.phone')}</dt>
                    <dd className="font-medium text-navy-900">{user.phone ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-navy-400">{t('field.organizationIds')}</dt>
                    <dd className="font-medium text-navy-900">
                      {user.organizationIds.length > 0 ? user.organizationIds.join(', ') : '—'}
                    </dd>
                  </div>
                </dl>
              </> :
            null}
          </PanelBody>
        </Panel>
      </div>
    </div>);

}
