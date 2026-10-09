import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeftIcon, InfoIcon, LockIcon, SaveIcon } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../../components/layout/AdminLayout';
import { Panel, PanelBody, PanelHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Field, TextArea } from '../../components/ui/Field';
import { Badge } from '../../components/ui/Badge';
import { SkeletonText } from '../../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../../components/ui/States';
import { useAsync } from '../../hooks/useAsync';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import { getFunction, updateFunctionRequirements } from '../../services/functionService';
import { getOrganizations } from '../../services/organizationService';
import { errorMessage, fieldErrorsOf } from '../../utils/errors';

export function FunctionRequirements() {
  const { id } = useParams<{id: string;}>();
  const functionId = Number(id);
  const { t } = useI18n();
  const { user, hasRole } = useAuth();

  const item = useAsync(() => getFunction(functionId), [functionId]);
  const organizations = useAsync(getOrganizations, []);

  const [requirements, setRequirements] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item.data) setRequirements(item.data.requirements ?? '');
  }, [item.data]);

  const organization = (organizations.data ?? []).find((org) => org.id === item.data?.organizationId);

  const roleAllowed = hasRole('ROLE_SUPER_ADMIN', 'ROLE_ORG_ADMIN');
  const scopeAllowed =
  user?.role === 'ROLE_SUPER_ADMIN' || (
  user?.role === 'ROLE_ORG_ADMIN' && item.data ? user.organizationIds.includes(item.data.organizationId) : false);
  const canSave = roleAllowed && scopeAllowed;

  const submit = async () => {
    if (!requirements.trim()) {
      setErrors({ requirements: t('validation.required') });
      return;
    }
    setSaving(true);
    try {
      const updated = await updateFunctionRequirements(functionId, { requirements });
      item.setData(updated);
      toast.success(t('toast.updated'));
      setErrors({});
    } catch (error) {
      const fields = fieldErrorsOf(error);
      setErrors(fields);
      if (Object.keys(fields).length === 0) toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Link
        to="/admin"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-navy-500 transition-colors hover:text-navy-900">
        
        <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
        {t('nav.dashboard')}
      </Link>

      <div className="mt-3">
        <PageHeader
          title={t('fnEdit.title')}
          description={item.data?.name}
          badge={item.data?.category ? <Badge tone="teal">{item.data.category}</Badge> : undefined} />
        
      </div>

      {item.loading ?
      <Panel>
          <PanelBody>
            <SkeletonText lines={6} />
          </PanelBody>
        </Panel> :
      item.error ?
      <Panel>
          <ErrorState error={item.error} onRetry={item.reload} />
        </Panel> :
      item.data ?
      <div className="grid gap-6 lg:grid-cols-3">
          <Panel className="lg:col-span-2">
            <PanelHeader title={t('field.requirements')} description={t('fnEdit.hint')} />
            <PanelBody>
              {canSave ?
            <div className="space-y-4">
                  <Field label={t('field.requirements')} error={errors.requirements} hint={t('fnEdit.hint')} required>
                    {({ id: fieldId, invalid, describedBy }) =>
                <TextArea
                  id={fieldId}
                  rows={12}
                  value={requirements}
                  invalid={invalid}
                  aria-describedby={describedBy}
                  onChange={(event) => setRequirements(event.target.value)}
                  className="font-mono text-[13px]" />

                }
                  </Field>
                  <Button onClick={submit} loading={saving} icon={<SaveIcon className="h-4 w-4" />}>
                    {t('action.save')}
                  </Button>
                </div> :

            <>
                  <EmptyState
                title="Ruxsat yo‘q"
                description={t('state.forbidden')}
                icon={<LockIcon className="h-5 w-5" />} />
              
                  <div className="rounded-lg border border-navy-100 bg-navy-50 p-4">
                    <p className="whitespace-pre-line text-[13px] leading-relaxed text-navy-600">
                      {item.data.requirements ?? t('fn.requirementsEmpty')}
                    </p>
                  </div>
                </>
            }
            </PanelBody>
          </Panel>

          <Panel className="h-fit">
            <PanelHeader title={t('fn.aboutTitle')} />
            <PanelBody className="space-y-3 text-[13px]">
              <div>
                <p className="text-navy-400">{t('field.id')}</p>
                <p className="font-medium text-navy-900">#{item.data.id}</p>
              </div>
              <div>
                <p className="text-navy-400">{t('field.name')}</p>
                <p className="font-medium text-navy-900">{item.data.name}</p>
              </div>
              <div>
                <p className="text-navy-400">{t('field.organization')}</p>
                <p className="font-medium text-navy-900">{organization?.name ?? `#${item.data.organizationId}`}</p>
              </div>
              <div>
                <p className="text-navy-400">{t('field.description')}</p>
                <p className="leading-relaxed text-navy-600">{item.data.description ?? '—'}</p>
              </div>
              <p className="flex items-start gap-2 rounded-lg bg-navy-50 p-3 text-[12px] leading-relaxed text-navy-500">
                <InfoIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                Saqlash faqat SUPER_ADMIN yoki tashkilotga biriktirilgan ORG_ADMIN uchun mavjud.
              </p>
            </PanelBody>
          </Panel>
        </div> :
      null}
    </div>);

}