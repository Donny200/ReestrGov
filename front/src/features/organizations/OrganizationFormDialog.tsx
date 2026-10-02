import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2Icon } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Field } from '../../components/ui/Field';
import { Input, Textarea } from '../../components/ui/Input';
import { useI18n } from '../../contexts/i18n';
import { applyServerErrors } from '../../lib/forms';
import type { Organization } from '../../types/api';
import { organizationSchema, type OrganizationFormValues } from './schema';
import { useSaveOrganization } from './queries';

const FORM_ID = 'organization-form';

interface OrganizationFormDialogProps {
  open: boolean;
  organization: Organization | null;
  onClose: () => void;
}

export function OrganizationFormDialog({ open, organization, onClose }: OrganizationFormDialogProps) {
  const { t } = useI18n();
  const save = useSaveOrganization();
  const schema = useMemo(() => organizationSchema(t), [t]);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<OrganizationFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '' },
  });

  useEffect(() => {
    if (open) reset({ name: organization?.name ?? '', description: organization?.description ?? '' });
  }, [open, organization, reset]);

  const submit = handleSubmit(async (values) => {
    try {
      await save.mutateAsync({ id: organization?.id, payload: { name: values.name, description: values.description || null } });
      toast.success(t(organization ? 'toast.updated' : 'toast.created'));
      onClose();
    } catch (error) {
      applyServerErrors(error, setError, (message) => toast.error(message), t);
    }
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeDisabled={isSubmitting}
      icon={<Building2Icon className="h-5 w-5" aria-hidden="true" />}
      title={organization ? t('orgs.edit') : t('orgs.create')}
      description={organization ? `#${organization.id}` : t('home.orgsSubtitle')}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>{t('action.cancel')}</Button>
          <Button type="submit" form={FORM_ID} loading={isSubmitting}>{organization ? t('action.save') : t('action.create')}</Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={submit} noValidate className="space-y-4">
        <Field label={t('field.name')} error={errors.name?.message} required>
          {(control) => (
            <Input {...control} maxLength={150} autoComplete="organization" placeholder={t('orgs.namePlaceholder', 'Ministry of Justice')} {...register('name')} />
          )}
        </Field>
        <Field label={t('field.description')} error={errors.description?.message} hint={t('field.optional')}>
          {(control) => <Textarea {...control} rows={4} maxLength={500} {...register('description')} />}
        </Field>
      </form>
    </Modal>
  );
}
