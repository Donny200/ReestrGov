import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { KeyRoundIcon, ShieldCheckIcon, UserRoundIcon } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../components/layout/PageHeader';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Field } from '../components/ui/Field';
import { Input } from '../components/ui/Input';
import { useAuth } from '../contexts/auth';
import { useI18n } from '../contexts/i18n';
import { applyServerErrors } from '../lib/forms';
import { passwordField } from '../lib/validation';
import { changePassword } from '../services/authService';
import type { Translate } from '../utils/errors';
import { fullName, roleLabel } from '../utils/format';

const passwordSchema = (t: Translate) =>
  z
    .object({
      currentPassword: z.string().min(1, t('validation.required')),
      newPassword: passwordField(t),
      repeatPassword: z.string(),
    })
    .refine((values) => values.newPassword === values.repeatPassword, {
      message: t('security.mismatch'),
      path: ['repeatPassword'],
    });

type PasswordValues = z.infer<ReturnType<typeof passwordSchema>>;

const emptyValues: PasswordValues = { currentPassword: '', newPassword: '', repeatPassword: '' };

export function SecuritySettings() {
  const { t } = useI18n();
  const { user, refreshUser } = useAuth();
  const schema = useMemo(() => passwordSchema(t), [t]);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PasswordValues>({ resolver: zodResolver(schema), defaultValues: emptyValues });

  const submit = handleSubmit(async (values) => {
    try {
      await changePassword({ currentPassword: values.currentPassword, newPassword: values.newPassword });
      await refreshUser();
      toast.success(t('security.success'));
      reset(emptyValues);
    } catch (error) {
      applyServerErrors(error, setError, (message) => toast.error(message), t);
    }
  });

  return (
    <div className="animate-fade-up">
      <PageHeader title={t('security.title')} description={t('security.passwordRule')} />

      <div className="grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader title={t('security.changePassword')} icon={<KeyRoundIcon className="h-4 w-4" aria-hidden="true" />} />
          <CardBody>
            <form className="max-w-lg space-y-5" onSubmit={submit} noValidate>
              <Field label={t('security.currentPassword')} error={errors.currentPassword?.message} required>
                {(control) => <Input {...control} type="password" autoComplete="current-password" {...register('currentPassword')} />}
              </Field>
              <Field label={t('security.newPassword')} error={errors.newPassword?.message} hint={t('security.passwordRule')} required>
                {(control) => <Input {...control} type="password" autoComplete="new-password" minLength={8} maxLength={100} {...register('newPassword')} />}
              </Field>
              <Field label={t('security.repeatPassword')} error={errors.repeatPassword?.message} required>
                {(control) => <Input {...control} type="password" autoComplete="new-password" minLength={8} maxLength={100} {...register('repeatPassword')} />}
              </Field>
              <div className="border-t border-line/80 pt-5">
                <Button type="submit" loading={isSubmitting} icon={<KeyRoundIcon />}>
                  {t('action.save')}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>

        <Card className="h-fit xl:sticky xl:top-24 xl:col-span-2">
          <CardHeader title={t('admin.welcome')} icon={<UserRoundIcon className="h-4 w-4" aria-hidden="true" />} />
          <CardBody>
            {user && (
              <>
                <div className="flex items-center gap-3 rounded-surface border border-line/80 bg-surface-subtle/60 p-3">
                  <Avatar user={user} size="lg" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-content-strong">{fullName(user)}</span>
                    <Badge tone="accent" className="mt-1">
                      <ShieldCheckIcon className="h-3.5 w-3.5" aria-hidden="true" />
                      {roleLabel(user.role, t)}
                    </Badge>
                  </span>
                </div>
                <dl className="mt-5 divide-y divide-line/80 text-[13px]">
                  <div className="py-3 first:pt-0">
                    <dt className="text-content-muted">{t('field.fullName')}</dt>
                    <dd className="mt-0.5 font-medium text-content-strong">{fullName(user)}</dd>
                  </div>
                  <div className="py-3">
                    <dt className="text-content-muted">{t('field.email')}</dt>
                    <dd className="mt-0.5 break-all font-medium text-content-strong">{user.email}</dd>
                  </div>
                  <div className="py-3">
                    <dt className="text-content-muted">{t('field.phone')}</dt>
                    <dd className="mt-0.5 font-medium text-content-strong">{user.phone ?? '—'}</dd>
                  </div>
                  <div className="py-3 last:pb-0">
                    <dt className="text-content-muted">{t('field.organizationIds')}</dt>
                    <dd className="mt-0.5 font-medium tabular-nums text-content-strong">
                      {user.organizationIds.length > 0 ? user.organizationIds.join(', ') : '—'}
                    </dd>
                  </div>
                </dl>
              </>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
