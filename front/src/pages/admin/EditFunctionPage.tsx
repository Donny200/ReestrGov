import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useIsMutating } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeftIcon } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { ActionBar } from '../../components/ui/ActionBar';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { buttonVariants } from '../../components/ui/buttonVariants';
import { FunctionStatusBadge, StatusPill } from '../../components/ui/Badge';
import { Skeleton, SkeletonText } from '../../components/ui/Skeleton';
import { FunctionAudit } from '../../components/functions/FunctionAudit';
import { FunctionFields } from '../../components/functions/FunctionFields';
import { FunctionPreview } from '../../components/functions/FunctionPreview';
import { FunctionRequirementsEditor } from '../../components/functions/FunctionRequirementsEditor';
import { FunctionTranslations } from '../../components/functions/FunctionTranslations';
import { FunctionWorkflow } from '../../components/functions/FunctionWorkflow';
import { FunctionErrorState } from '../../features/functions/FunctionErrorState';
import { InlineAlert } from '../../features/functions/InlineAlert';
import { useAdminFunction, useFunctionOptions, useUpdateFunction } from '../../features/functions/queries';
import { formOf, functionFormSchema, toUpdateRequest } from '../../features/functions/schema';
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges';
import { useAuth } from '../../contexts/auth';
import { useI18n } from '../../contexts/i18n';
import { applyServerErrors } from '../../lib/forms';
import { functionText } from '../../utils/functionLocalization';
import type { AdminFunction, FunctionFormValues } from '../../types/adminFunctions';

export function LegacyFunctionEditorRedirect() {
  const { id } = useParams();
  return <Navigate to={`/admin/functions/${id}`} replace />;
}

function EditorSkeleton() {
  return (
    <div role="status" aria-busy="true">
      <div className="mb-8 space-y-3">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-9 w-80 max-w-full" />
        <Skeleton className="h-4 w-56" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Card><CardBody><SkeletonText lines={9} /></CardBody></Card>
        <div className="space-y-6">
          <Card><CardBody><SkeletonText lines={3} /></CardBody></Card>
          <Card><CardBody><SkeletonText lines={4} /></CardBody></Card>
        </div>
      </div>
    </div>
  );
}

export function EditFunctionPage() {
  const { id } = useParams();
  const functionId = Number(id);
  const record = useAdminFunction(functionId);
  if (!Number.isFinite(functionId)) return <Navigate to="/admin/functions" replace />;
  if (record.isPending) return <EditorSkeleton />;
  if (record.error || !record.data) {
    return (
      <Card>
        <FunctionErrorState error={record.error} onRetry={() => void record.refetch()} />
      </Card>
    );
  }
  return <FunctionEditor key={functionId} record={record.data} />;
}

function FunctionEditor({ record }: { record: AdminFunction }) {
  const { t, locale } = useI18n();
  const { hasPermission } = useAuth();
  const options = useFunctionOptions();
  const update = useUpdateFunction(record.id);
  const busy = useIsMutating() > 0;
  const schema = useMemo(() => functionFormSchema(t), [t]);
  const form = useForm<FunctionFormValues>({ resolver: zodResolver(schema), defaultValues: formOf(record) });
  const { handleSubmit, reset, setError, formState: { isDirty } } = form;
  const [secondaryDirty, setSecondaryDirty] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const baselineKey = JSON.stringify(formOf(record));

  useEffect(() => {
    reset(JSON.parse(baselineKey) as FunctionFormValues);
  }, [baselineKey, reset]);

  const editable = record.status === 'DRAFT' && hasPermission('FUNCTIONS_EDIT');
  const requirementsOnly = record.status === 'DRAFT' && !editable && hasPermission('FUNCTIONS_MANAGE_REQUIREMENTS');
  const canTranslate = hasPermission('FUNCTIONS_EDIT') && hasPermission('FUNCTIONS_TRANSLATIONS_EDIT');

  useUnsavedChanges(isDirty, t('fnAdmin.discard'));

  const save = handleSubmit(async (values) => {
    if (!editable) return;
    setFormError(null);
    try {
      const saved = await update.mutateAsync(toUpdateRequest(values));
      reset(formOf(saved));
      toast.success(t('fnAdmin.saved'));
    } catch (error) {
      applyServerErrors(error, setError, setFormError, t);
    }
  });

  const organizations = useMemo(() => {
    const list = [...(options.data?.organizations ?? [])];
    if (record.organizationId !== null && !list.some((organization) => organization.id === record.organizationId)) {
      list.push({ id: record.organizationId, name: `#${record.organizationId}` });
    }
    return list;
  }, [options.data, record.organizationId]);

  const organizationName =
    organizations.find((organization) => organization.id === record.organizationId)?.name ?? t('fnAdmin.unassigned');
  const title = functionText(record, 'name', locale) || record.name;
  const statusHint = editable || requirementsOnly
    ? null
    : t(
        record.status === 'PENDING_REVIEW'
          ? 'fnAdmin.reviewHint'
          : record.status === 'PUBLISHED'
            ? 'fnAdmin.publishedHint'
            : record.status === 'DEACTIVATED'
              ? 'fnAdmin.deactivatedHint'
              : 'fnAdmin.readOnly',
      );

  return (
    <div>
      <PageHeader
        eyebrow={t('nav.functions')}
        title={title}
        description={`#${record.id} · ${organizationName}`}
        breadcrumbs={[{ label: t('nav.functions'), to: '/admin/functions' }, { label: title }]}
        badge={
          <span className="flex flex-wrap items-center gap-2">
            <FunctionStatusBadge status={record.status} />
            {isDirty && <StatusPill tone="pending">{t('fnAdmin.unsaved')}</StatusPill>}
          </span>
        }
        actions={
          <Link to="/admin/functions" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            <ArrowLeftIcon aria-hidden="true" />
            {t('action.back')}
          </Link>
        }
      />

      {statusHint && <InlineAlert tone="info" className="mb-6">{statusHint}</InlineAlert>}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader title={t('fnAdmin.original')} description={t('fnAdmin.originalHint')} />
            {options.isPending ? (
              <CardBody><SkeletonText lines={8} /></CardBody>
            ) : options.error ? (
              <FunctionErrorState error={options.error} onRetry={() => void options.refetch()} />
            ) : (
              <form onSubmit={save} noValidate>
                <CardBody className="space-y-5">
                  <FunctionFields
                    form={form}
                    organizations={organizations}
                    categories={options.data?.categories ?? []}
                    disabled={!editable || busy || secondaryDirty}
                  />
                  {editable && <p className="text-sm leading-5 text-secondary">{t('fnAdmin.sourceChanged')}</p>}
                  {formError && <InlineAlert tone="danger">{formError}</InlineAlert>}
                </CardBody>
                {editable && (
                  <ActionBar status={isDirty ? <StatusPill tone="pending">{t('fnAdmin.unsaved')}</StatusPill> : undefined}>
                    <Button type="submit" variant="dark" loading={update.isPending} disabled={busy || secondaryDirty || !isDirty}>
                      {t('action.save')}
                    </Button>
                  </ActionBar>
                )}
              </form>
            )}
          </Card>

          {requirementsOnly && <FunctionRequirementsEditor record={record} busy={busy} onDirty={setSecondaryDirty} />}
          {canTranslate && <FunctionTranslations record={record} busy={busy} blocked={isDirty} onDirty={setSecondaryDirty} />}
          {hasPermission('AUDIT_VIEW') && <FunctionAudit functionId={record.id} />}
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24">
          <FunctionWorkflow record={record} dirty={isDirty || secondaryDirty} busy={busy} />
          <FunctionPreview record={record} />
        </aside>
      </div>
    </div>
  );
}
