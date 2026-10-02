import { useEffect, useRef, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { CheckIcon, LanguagesIcon, SaveIcon } from 'lucide-react';
import { FunctionAutoTranslate } from './FunctionAutoTranslate';
import { useI18n } from '../../contexts/i18n';
import { useSaveFunctionTranslation } from '../../features/functions/queries';
import { DESCRIPTION_MAX, NAME_MAX } from '../../features/functions/schema';
import { InlineAlert } from '../../features/functions/InlineAlert';
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges';
import { cn } from '../../lib/cn';
import { errorMessage, fieldErrorsOf } from '../../utils/errors';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, CardBody, CardHeader } from '../ui/Card';
import { Field } from '../ui/Field';
import { Input, Select, Textarea } from '../ui/Input';
import type { AdminFunction } from '../../types/adminFunctions';

interface Props {
  record: AdminFunction;
  busy: boolean;
  blocked: boolean;
  onDirty: (dirty: boolean) => void;
}

interface TranslationForm {
  name: string;
  description: string;
}

function baselineOf(record: AdminFunction, language: string): TranslationForm {
  return {
    name: record.nameTranslations?.[language]?.text || record.name,
    description: record.descriptionTranslations?.[language]?.text || record.description || '',
  };
}

export function FunctionTranslations({ record, busy, blocked, onDirty }: Props) {
  const { t, locale, available } = useI18n();
  const save = useSaveFunctionTranslation(record.id);
  const [language, setLanguage] = useState(locale);
  const [pendingLanguage, setPendingLanguage] = useState<string | null>(null);
  const baselineKey = JSON.stringify(baselineOf(record, language));
  const [form, setForm] = useState<TranslationForm>(() => baselineOf(record, language));
  const [error, setError] = useState<unknown>(null);

  const original = language === record.sourceLanguage;
  const editable = record.status === 'DRAFT' && !original;
  const missing =
    !record.nameTranslations?.[language]?.text || Boolean(record.description && !record.descriptionTranslations?.[language]?.text);
  const dirty = JSON.stringify(form) !== baselineKey;
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;

  useEffect(() => {
    setForm(JSON.parse(baselineKey) as TranslationForm);
    setError(null);
  }, [baselineKey]);

  useEffect(() => {
    onDirty(dirty);
    return () => onDirty(false);
  }, [dirty, onDirty]);

  useEffect(() => {
    if (!dirtyRef.current) setLanguage(locale);
  }, [locale]);

  useUnsavedChanges(dirty, t('fnAdmin.discard'));

  const changeLanguage = (next: string) => {
    if (next === language) return;
    if (dirty) {
      setPendingLanguage(next);
      return;
    }
    setLanguage(next);
  };

  const discardAndSwitch = () => {
    if (pendingLanguage) setLanguage(pendingLanguage);
    setPendingLanguage(null);
  };

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy || blocked || !editable) return;
    setError(null);
    try {
      await save.mutateAsync({ language, name: form.name.trim(), description: form.description.trim() });
      toast.success(t('fnAdmin.translationSuccess'));
    } catch (failure) {
      setError(failure);
    }
  }

  const errors = fieldErrorsOf(error);
  const sourceBadge = (field: 'nameTranslations' | 'descriptionTranslations') => {
    const source = record[field]?.[language]?.source;
    if (!source) return null;
    return (
      <Badge tone={source === 'human' ? 'brand' : 'neutral'} dot>
        {source === 'human' && <CheckIcon className="h-3 w-3" aria-hidden="true" />}
        {t(`fnAdmin.${source}`)}
      </Badge>
    );
  };
  const saveDisabled =
    busy || blocked || (!dirty && !missing) || !form.name.trim() || (Boolean(record.description) && !form.description.trim());

  return (
    <Card>
      <CardHeader title={t('fnAdmin.translations')} description={t('fnAdmin.translationsHint', 'Localized name and description for every active language.')} icon={<LanguagesIcon className="h-4 w-4" />} />
      <CardBody className="space-y-5">
        <FunctionAutoTranslate record={record} language={language} blocked={blocked || dirty} busy={busy} />

        <div className="space-y-2">
          <p className="text-sm font-medium text-content-strong">{t('field.language')}</p>
          <div className="hidden flex-wrap gap-2 sm:flex" role="group" aria-label={t('fnAdmin.languages')}>
            {available.map((item) => {
              const active = item.code === language;
              const complete = item.code === record.sourceLanguage || Boolean(record.nameTranslations?.[item.code]?.text);
              return (
                <Button
                  key={item.code}
                  type="button"
                  variant={active ? 'primary' : 'outline'}
                  size="sm"
                  className={cn('rounded-full', !active && !complete && 'border-dashed text-content-muted')}
                  aria-pressed={active}
                  disabled={busy}
                  onClick={() => changeLanguage(item.code)}
                >
                  {item.label}
                </Button>
              );
            })}
          </div>
          <Select className="sm:hidden" aria-label={t('fnAdmin.languages')} value={language} disabled={busy} onChange={(event) => changeLanguage(event.target.value)}>
            {available.map((item) => (
              <option key={item.code} value={item.code}>{item.label}</option>
            ))}
          </Select>
        </div>

        {pendingLanguage && (
          <InlineAlert
            tone="warning"
            action={
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setPendingLanguage(null)}>{t('fnAdmin.keepEditing', 'Keep editing')}</Button>
                <Button variant="danger" size="sm" onClick={discardAndSwitch}>{t('fnAdmin.discardChanges', 'Discard')}</Button>
              </div>
            }
          >
            {t('fnAdmin.discard')}
          </InlineAlert>
        )}

        {blocked && <InlineAlert tone="warning">{t('fnAdmin.saveFirst')}</InlineAlert>}

        {original ? (
          <InlineAlert tone="info">{t('fnAdmin.originalLanguageHint')}</InlineAlert>
        ) : (
          <form onSubmit={submit} className="space-y-5">
            <div className="flex flex-wrap gap-2">
              {dirty && <Badge tone="warning" dot>{t('fnAdmin.unsaved')}</Badge>}
              {missing && <Badge tone="warning">{t('fnAdmin.translationGaps')}</Badge>}
            </div>
            <fieldset disabled={!editable || busy || blocked} className="space-y-5">
              <Field label={t('field.name')} required error={errors.name}>
                {(control) => (
                  <Input {...control} value={form.name} maxLength={NAME_MAX} onChange={(event) => setForm({ ...form, name: event.target.value })} />
                )}
              </Field>
              {sourceBadge('nameTranslations')}
              <Field label={t('field.description')} required={Boolean(record.description)} error={errors.description}>
                {(control) => (
                  <Textarea {...control} rows={4} value={form.description} maxLength={DESCRIPTION_MAX} onChange={(event) => setForm({ ...form, description: event.target.value })} />
                )}
              </Field>
              {sourceBadge('descriptionTranslations')}
            </fieldset>
            {Boolean(error) && Object.keys(errors).length === 0 && <InlineAlert tone="danger">{errorMessage(error, t)}</InlineAlert>}
            {editable && (
              <div className="flex justify-end">
                <Button type="submit" icon={<SaveIcon />} loading={save.isPending} disabled={saveDisabled}>
                  {t('action.save')}
                </Button>
              </div>
            )}
          </form>
        )}
      </CardBody>
    </Card>
  );
}
