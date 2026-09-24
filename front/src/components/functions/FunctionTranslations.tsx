import { FunctionAutoTranslate } from './FunctionAutoTranslate';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useI18n } from '../../contexts/i18n';
import { Panel, PanelHeader, PanelBody } from '../ui/Card';
import { Field, TextInput, TextArea, Select } from '../ui/Field';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ErrorState } from '../ui/States';
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges';
import { saveFunctionTranslation } from '../../services/adminFunctionService';
import { fieldErrorsOf } from '../../utils/errors';
import type { AdminFunction } from '../../types/adminFunctions';

interface Props {
  record: AdminFunction;
  busy: boolean;
  blocked: boolean;
  onBusy: (value: boolean) => void;
  onDirty: (value: boolean) => void;
  onUpdate: (record: AdminFunction) => void;
}
function values(record: AdminFunction, language: string) {
  return {
    name: record.nameTranslations?.[language]?.text || record.name,
    description: record.descriptionTranslations?.[language]?.text || record.description || '',
  };
}
export function FunctionTranslations({ record, busy, blocked, onBusy, onDirty, onUpdate }: Props) {
  const { t, locale, available } = useI18n();
  const [language, setLanguage] = useState(locale);
  const [form, setForm] = useState(() => values(record, locale));
  const [error, setError] = useState<unknown>(null);
  const [saving, setSaving] = useState(false);
  const original = language === record.sourceLanguage;
  const editable = record.status === 'DRAFT' && !original;
  const missing = !record.nameTranslations?.[language]?.text || Boolean(record.description && !record.descriptionTranslations?.[language]?.text);
  const dirty = JSON.stringify(form) !== JSON.stringify(values(record, language));
  useEffect(() => { onDirty(dirty); return () => onDirty(false); }, [dirty, onDirty]);
  useEffect(() => { setForm(values(record, language)); setError(null); }, [record, language]);
  useEffect(() => {
    // Global language changes never discard an unsaved translation.
    if (!dirty) setLanguage(locale);
    // Only changes of the application's language should select another editor language.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);
  useUnsavedChanges(dirty, t('fnAdmin.discard'));
  const changeLanguage = (next: string) => {
    if (!dirty || window.confirm(t('fnAdmin.discard'))) setLanguage(next);
  };
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (busy || blocked || !editable) return;
    onBusy(true); setSaving(true); setError(null);
    try {
      const saved = await saveFunctionTranslation(record.id, language, { name: form.name.trim(), description: form.description.trim() });
      onUpdate(saved); toast.success(t('fnAdmin.translationSuccess'));
    } catch (failure) { setError(failure); } finally { onBusy(false); setSaving(false); }
  }
  const errors = fieldErrorsOf(error);
  const sourceBadge = (field: 'nameTranslations' | 'descriptionTranslations') => {
    const source = record[field]?.[language]?.source;
    return source ? <Badge tone={source === 'human' ? 'teal' : 'gray'}>{t('fnAdmin.' + source)}</Badge> : null;
  };
  return <Panel className="mt-5">
    <PanelHeader title={t('fnAdmin.translations')} />
    <PanelBody>
      <div className="max-w-3xl space-y-5">
        <FunctionAutoTranslate record={record} language={language} blocked={blocked || dirty} busy={busy} onBusy={onBusy} onUpdate={onUpdate} />
        <Field label={t('field.language')}>{() =>
          <Select value={language} disabled={busy} onChange={e => changeLanguage(e.target.value)}>
            {available.map(lang => <option key={lang.code} value={lang.code}>{lang.label}</option>)}
          </Select>}</Field>
        <div className="flex flex-wrap gap-2" aria-label={t('fnAdmin.languages')}>
          {available.map(lang => <Button key={lang.code} variant={lang.code === language ? 'primary' : 'outline'}
            aria-pressed={lang.code === language} disabled={busy} onClick={() => changeLanguage(lang.code)}>{lang.label}</Button>)}
        </div>
        {original ? <p className="text-sm text-content-muted">{t('fnAdmin.originalLanguageHint')}</p> :
          <form onSubmit={save} className="space-y-5">
            {dirty && <p role="status" className="text-sm text-amber-700">{t('fnAdmin.unsaved')}</p>}
            {missing && <p className="text-sm text-amber-700">{t('fnAdmin.translationGaps')}</p>}
            <fieldset disabled={!editable || busy || blocked} className="space-y-5">
              <Field label={t('field.name')} required error={errors.name}>{() =>
                <TextInput value={form.name} maxLength={150} onChange={e => setForm({ ...form, name: e.target.value })} />}</Field>
              {sourceBadge('nameTranslations')}
              <Field label={t('field.description')} required={Boolean(record.description)} error={errors.description}>{() =>
                <TextArea rows={4} value={form.description} maxLength={500} onChange={e => setForm({ ...form, description: e.target.value })} />}</Field>
              {sourceBadge('descriptionTranslations')}
            </fieldset>
            {Boolean(error) && <ErrorState error={error} />}
            {editable && <Button type="submit" loading={saving} disabled={busy || blocked || (!dirty && !missing) || !form.name.trim() ||
              (Boolean(record.description) && !form.description.trim())}>{t('action.save')}</Button>}
          </form>}
      </div>
    </PanelBody>
  </Panel>;
}
