import type { UseFormReturn } from 'react-hook-form';
import { Field } from '../ui/Field';
import { Input, Select, Textarea } from '../ui/Input';
import { useI18n } from '../../contexts/i18n';
import { localizedText } from '../../utils/translations';
import { DESCRIPTION_MAX, NAME_MAX, REQUIREMENTS_MAX } from '../../features/functions/schema';
import type { FunctionCategory, FunctionFormValues, FunctionOrganization } from '../../types/adminFunctions';

interface Props {
  form: UseFormReturn<FunctionFormValues>;
  organizations: FunctionOrganization[];
  categories: FunctionCategory[];
  disabled?: boolean;
}

export function FunctionFields({ form, organizations, categories, disabled = false }: Props) {
  const { t, locale, available } = useI18n();
  const { register, watch, formState: { errors } } = form;
  const sourceLanguage = watch('sourceLanguage');
  const languages = available.some((language) => language.code === sourceLanguage)
    ? available
    : [...available, { code: sourceLanguage, label: sourceLanguage }];

  return (
    <fieldset disabled={disabled} className="grid min-w-0 gap-5">
      <Field label={t('field.name')} required error={errors.name?.message}>
        {(control) => <Input {...control} maxLength={NAME_MAX} autoComplete="off" {...register('name')} />}
      </Field>
      <Field label={t('field.description')} required error={errors.description?.message}>
        {(control) => <Textarea {...control} rows={4} maxLength={DESCRIPTION_MAX} {...register('description')} />}
      </Field>
      <Field label={t('field.requirements')} hint={t('fnAdmin.requirementsHint')} error={errors.requirements?.message}>
        {(control) => <Textarea {...control} rows={4} maxLength={REQUIREMENTS_MAX} {...register('requirements')} />}
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={t('field.organization')} required error={errors.organizationId?.message}>
          {(control) => (
            <Select {...control} {...register('organizationId')}>
              <option value="">{t('fnAdmin.choose')}</option>
              {organizations.map((organization) => (
                <option key={organization.id} value={organization.id}>{organization.name}</option>
              ))}
            </Select>
          )}
        </Field>
        <Field label={t('field.category')} error={errors.categoryId?.message}>
          {(control) => (
            <Select {...control} {...register('categoryId')}>
              <option value="">{t('fnAdmin.noCategory')}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{localizedText(category.name, category.nameTranslations, locale)}</option>
              ))}
            </Select>
          )}
        </Field>
      </div>
      <Field label={t('fnAdmin.sourceLanguage')} required error={errors.sourceLanguage?.message}>
        {(control) => (
          <Select {...control} {...register('sourceLanguage')}>
            {languages.map((language) => (
              <option key={language.code} value={language.code}>{language.label}</option>
            ))}
          </Select>
        )}
      </Field>
    </fieldset>
  );
}
