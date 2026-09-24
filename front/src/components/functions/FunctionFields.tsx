import { Field, Select, TextInput, TextArea } from '../ui/Field';
import { useI18n } from '../../contexts/i18n';
import { localizedText } from '../../utils/translations';
import type { FunctionCategory, FunctionFormValues, FunctionOrganization } from '../../types/adminFunctions';

interface Props {
  value: FunctionFormValues;
  onChange: (value: FunctionFormValues) => void;
  organizations: FunctionOrganization[];
  categories: FunctionCategory[];
  disabled?: boolean;
  errors?: Record<string, string>;
}
export function FunctionFields({ value, onChange, organizations, categories, disabled, errors = {} }: Props) {
  const { t, locale, available } = useI18n();
  const change = (field: keyof FunctionFormValues, next: string) => onChange({ ...value, [field]: next });
  const languages = available.some(lang => lang.code === value.sourceLanguage)
    ? available : [...available, { code: value.sourceLanguage, label: value.sourceLanguage }];
  return <fieldset disabled={disabled} className="grid min-w-0 gap-5">
    <Field label={t('field.name')} required error={errors.name}>{() =>
      <TextInput value={value.name} maxLength={150} onChange={e => change('name', e.target.value)} />}</Field>
    <Field label={t('field.description')} required error={errors.description}>{() =>
      <TextArea rows={4} value={value.description} maxLength={500} onChange={e => change('description', e.target.value)} />}</Field>
    <Field label={t('field.requirements')} hint={t('fnAdmin.requirementsHint')} error={errors.requirements}>{() =>
      <TextArea rows={4} value={value.requirements} maxLength={500} onChange={e => change('requirements', e.target.value)} />}</Field>
    <div className="grid gap-5 sm:grid-cols-2">
      <Field label={t('field.organization')} required error={errors.organizationId}>{() =>
        <Select value={value.organizationId} onChange={e => change('organizationId', e.target.value)}>
          <option value="">{t('fnAdmin.choose')}</option>
          {organizations.map(org => <option key={org.id} value={org.id}>{org.name}</option>)}
        </Select>}</Field>
      <Field label={t('field.category')} error={errors.categoryId}>{() =>
        <Select value={value.categoryId} onChange={e => change('categoryId', e.target.value)}>
          <option value="">{t('fnAdmin.noCategory')}</option>
          {categories.map(category => <option key={category.id} value={category.id}>{localizedText(category.name, category.nameTranslations, locale)}</option>)}
        </Select>}</Field>
    </div>
    <Field label={t('fnAdmin.sourceLanguage')} required error={errors.sourceLanguage}>{() =>
      <Select value={value.sourceLanguage} onChange={e => change('sourceLanguage', e.target.value)}>
        {languages.map(lang => <option key={lang.code} value={lang.code}>{lang.label}</option>)}
      </Select>}</Field>
  </fieldset>;
}
