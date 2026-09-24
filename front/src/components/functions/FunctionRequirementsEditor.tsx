import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { useI18n } from '../../contexts/i18n';
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges';
import { updateFunctionRequirements } from '../../services/functionService';
import { getAdminFunction } from '../../services/adminFunctionService';
import { Panel, PanelHeader, PanelBody } from '../ui/Card';
import { Field, TextArea } from '../ui/Field';
import { Button } from '../ui/Button';
import { ErrorState } from '../ui/States';
import type { AdminFunction } from '../../types/adminFunctions';

interface Props {
  record: AdminFunction; busy: boolean;
  onBusy: (value: boolean) => void; onDirty: (value: boolean) => void;
  onUpdate: (record: AdminFunction) => void;
}
export function FunctionRequirementsEditor({ record, busy, onBusy, onDirty, onUpdate }: Props) {
  const { t } = useI18n();
  const [text, setText] = useState(record.requirements ?? '');
  const [error, setError] = useState<unknown>(null);
  const dirty = text !== (record.requirements ?? '');
  useEffect(() => { setText(record.requirements ?? ''); }, [record]);
  useEffect(() => { onDirty(dirty); return () => onDirty(false); }, [dirty, onDirty]);
  useUnsavedChanges(dirty, t('fnAdmin.discard'));
  async function save(event: FormEvent) {
    event.preventDefault();
    if (busy || !dirty || !text.trim()) return;
    onBusy(true); setError(null);
    try {
      await updateFunctionRequirements(record.id, { requirements: text });
      onUpdate(await getAdminFunction(record.id));
      toast.success(t('fnAdmin.saved'));
    } catch (failure) { setError(failure); } finally { onBusy(false); }
  }
  return <Panel className="mt-5">
    <PanelHeader title={t('fnEdit.title')} description={t('fnAdmin.requirementsHint')} />
    <PanelBody><form className="max-w-3xl space-y-4" onSubmit={save}>
      <Field label={t('field.requirements')} required>{() =>
        <TextArea rows={5} maxLength={500} value={text} disabled={busy} onChange={event => setText(event.target.value)} />}</Field>
      {dirty && <p className="text-sm text-amber-700">{t('fnAdmin.unsaved')}</p>}
      {Boolean(error) && <ErrorState error={error} />}
      <Button type="submit" loading={busy} disabled={!dirty || !text.trim()}>{t('action.save')}</Button>
    </form></PanelBody>
  </Panel>;
}
