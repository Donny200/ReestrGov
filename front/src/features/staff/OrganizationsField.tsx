import { CheckboxList } from '../../components/ui/CheckboxList';
import { Field } from '../../components/ui/Field';
import { Select } from '../../components/ui/Input';
import { useI18n } from '../../contexts/i18n';
import type { Organization } from '../../types/api';
import type { OrganizationMode } from './types';

interface OrganizationsFieldProps {
  mode: OrganizationMode;
  organizations: Organization[];
  value: number[];
  onChange: (ids: number[]) => void;
  error?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function OrganizationsField({ mode, organizations, value, onChange, error, hint, required = true, disabled = false, className }: OrganizationsFieldProps) {
  const { t } = useI18n();
  const label = (organization: Organization) => `#${organization.id} — ${organization.name}`;

  if (mode === 'multiple') {
    return (
      <CheckboxList
        className={className}
        legend={t('field.organizations')}
        options={organizations.map((organization) => ({ value: organization.id, label: label(organization) }))}
        selected={value}
        onChange={onChange}
        error={error}
        hint={hint}
        required={required}
        columns={2}
      />
    );
  }

  return (
    <Field label={t('field.organization')} error={error} hint={hint} required={required} className={className}>
      {(control) => (
        <Select
          {...control}
          disabled={disabled}
          value={value[0]?.toString() ?? ''}
          onChange={(event) => onChange(event.target.value ? [Number(event.target.value)] : [])}
        >
          <option value="">{required ? t('validation.selectOrg') : t('staff.keepOrganization', 'Keep current organization')}</option>
          {organizations.map((organization) => (
            <option key={organization.id} value={organization.id}>{label(organization)}</option>
          ))}
        </Select>
      )}
    </Field>
  );
}
