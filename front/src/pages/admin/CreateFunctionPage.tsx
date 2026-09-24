import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { PageHeader } from '../../components/layout/AdminLayout';
import { Panel, PanelBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ErrorState, LoadingState } from '../../components/ui/States';
import { FunctionFields } from '../../components/functions/FunctionFields';
import { useFunctionOptions } from '../../hooks/useFunctionOptions';
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges';
import { useI18n } from '../../contexts/i18n';
import { createFunction } from '../../services/adminFunctionService';
import { fieldErrorsOf } from '../../utils/errors';
import type { FunctionFormValues } from '../../types/adminFunctions';

export function CreateFunctionPage() {
  const { t, locale, available } = useI18n();
  const navigate = useNavigate();
  const options = useFunctionOptions();
  const [form, setForm] = useState<FunctionFormValues>(() => ({
    name: '', description: '', requirements: '', organizationId: '', categoryId: '',
    sourceLanguage: available.some(lang => lang.code === locale) ? locale : 'en',
  }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const dirty = Boolean(form.name || form.description || form.requirements || form.organizationId || form.categoryId);
  useUnsavedChanges(dirty && !busy, t('fnAdmin.discard'));
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError(null);
    try {
      const result = await createFunction({
        name: form.name.trim(), description: form.description.trim(), requirements: form.requirements,
        organizationId: Number(form.organizationId), categoryId: form.categoryId ? Number(form.categoryId) : undefined,
        sourceLanguage: form.sourceLanguage,
      });
      toast.success(t('fnAdmin.createSuccess'));
      navigate('/admin/functions/' + result.id, { replace: true, state: { created: true } });
    } catch (failure) { setError(failure); setBusy(false); }
  }
  return <div>
    <PageHeader title={t('fnAdmin.create')} badge={dirty ? <span className="text-sm text-amber-700">{t('fnAdmin.unsaved')}</span> : undefined}
      actions={<Link to="/admin/functions" className="text-brand hover:underline">{t('action.back')}</Link>} />
    {options.loading ? <LoadingState /> : options.error ? <ErrorState error={options.error} onRetry={options.reload} /> :
      <Panel><PanelBody><form onSubmit={submit} className="max-w-3xl space-y-6">
        <FunctionFields value={form} onChange={setForm} organizations={options.data?.organizations ?? []}
          categories={options.data?.categories ?? []} disabled={busy} errors={fieldErrorsOf(error)} />
        {!options.data?.organizations.length && <p role="alert">{t('fnAdmin.noOrganizations')}</p>}
        {Boolean(error) && <ErrorState error={error} />}
        <Button type="submit" loading={busy} disabled={!options.data?.organizations.length || !form.name.trim() || !form.description.trim() || !form.organizationId}>
          {t('fnAdmin.create')}
        </Button>
      </form></PanelBody></Panel>}
  </div>;
}
