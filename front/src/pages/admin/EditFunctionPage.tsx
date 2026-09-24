import { useEffect, useState, type FormEvent } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { PageHeader } from '../../components/layout/AdminLayout';
import { Panel, PanelBody, PanelHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ErrorState, LoadingState } from '../../components/ui/States';
import { FunctionFields } from '../../components/functions/FunctionFields';
import { FunctionStatusBadge } from '../../components/functions/FunctionStatusBadge';
import { useFunctionOptions } from '../../hooks/useFunctionOptions';
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges';
import { useAsync } from '../../hooks/useAsync';
import { useI18n } from '../../contexts/i18n';
import { useAuth } from '../../contexts/auth';
import { getAdminFunction, updateFunction } from '../../services/adminFunctionService';
import { fieldErrorsOf } from '../../utils/errors';
import { localizedText } from '../../utils/translations';
import type { AdminFunction, FunctionFormValues } from '../../types/adminFunctions';

function formOf(value: AdminFunction): FunctionFormValues {
  return { name: value.name, description: value.description ?? '', requirements: value.requirements ?? '',
    organizationId: value.organizationId?.toString() ?? '', categoryId: value.categoryId?.toString() ?? '',
    sourceLanguage: value.sourceLanguage };
}
export function LegacyFunctionEditorRedirect() {
  const { id } = useParams();
  return <Navigate to={`/admin/functions/${id}`} replace />;
}
export function EditFunctionPage() {
  const { id } = useParams();
  const result = useAsync(() => getAdminFunction(Number(id)), [id]);
  if (result.loading) return <LoadingState />;
  if (result.error || !result.data) return <ErrorState error={result.error} onRetry={result.reload} />;
  return <FunctionEditor key={id} record={result.data} onUpdate={result.setData} />;
}
function FunctionEditor({ record, onUpdate }: { record: AdminFunction; onUpdate: (value: AdminFunction) => void }) {
  const { t, locale } = useI18n();
  const { hasPermission } = useAuth();
  const options = useFunctionOptions();
  const [form, setForm] = useState(() => formOf(record));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  useEffect(() => { setForm(formOf(record)); }, [record]);
  const dirty = JSON.stringify(form) !== JSON.stringify(formOf(record));
  const editable = record.status === 'DRAFT' && hasPermission('FUNCTIONS_EDIT');
  useUnsavedChanges(dirty, t('fnAdmin.discard'));
  async function save(event: FormEvent) {
    event.preventDefault();
    if (!editable || busy) return;
    setBusy(true); setError(null);
    try {
      const saved = await updateFunction(record.id, {
        name: form.name.trim(), description: form.description.trim(), requirements: form.requirements,
        organizationId: Number(form.organizationId), categoryId: form.categoryId ? Number(form.categoryId) : undefined,
        category: form.categoryId ? undefined : '', sourceLanguage: form.sourceLanguage,
      });
      onUpdate(saved); toast.success(t('fnAdmin.saved'));
    } catch (failure) { setError(failure); } finally { setBusy(false); }
  }
  const organizations = [...(options.data?.organizations ?? [])];
  if (record.organizationId && !organizations.some(org => org.id === record.organizationId)) {
    organizations.push({ id: record.organizationId, name: '#' + record.organizationId });
  }
  return <div>
    <PageHeader title={localizedText(record.name, record.nameTranslations, locale) ?? record.name}
      badge={<FunctionStatusBadge status={record.status} />}
      actions={<Link to="/admin/functions" className="text-brand hover:underline">{t('action.back')}</Link>} />
    {dirty && <p role="status" className="mb-4 rounded-control bg-amber-50 p-3 text-sm text-amber-800">{t('fnAdmin.unsaved')}</p>}
    {!editable && <p className="mb-4 rounded-control bg-navy-50 p-4 text-sm">
      {t(record.status === 'PENDING_REVIEW' ? 'fnAdmin.reviewHint' : record.status === 'PUBLISHED' ? 'fnAdmin.publishedHint' :
        record.status === 'DEACTIVATED' ? 'fnAdmin.deactivatedHint' : 'fnAdmin.readOnly')}
    </p>}
    <Panel>
      <PanelHeader title={t('fnAdmin.original')} description={t('fnAdmin.originalHint')} />
      <PanelBody>
        {options.loading ? <LoadingState /> : options.error ? <ErrorState error={options.error} onRetry={options.reload} /> :
          <form onSubmit={save} className="max-w-3xl space-y-6">
            <FunctionFields value={form} onChange={setForm} organizations={organizations}
              categories={options.data?.categories ?? []} disabled={!editable || busy} errors={fieldErrorsOf(error)} />
            {editable && <p className="text-xs text-content-muted">{t('fnAdmin.sourceChanged')}</p>}
            {Boolean(error) && <ErrorState error={error} />}
            {editable && <Button type="submit" loading={busy}
              disabled={!dirty || !form.name.trim() || !form.description.trim() || !form.organizationId}>{t('action.save')}</Button>}
          </form>}
      </PanelBody>
    </Panel>
  </div>;
}
