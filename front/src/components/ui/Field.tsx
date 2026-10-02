import { useId, type ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { useI18n } from '../../contexts/i18n';
import { FieldControlContext, type FieldControlContextValue } from './fieldContext';
import { Input, Select, Textarea } from './Input';

export interface FieldControl {
  id: string;
  invalid: boolean;
  valid: boolean;
  describedBy: string | undefined;
}

interface FieldProps {
  label: string;
  error?: string;
  hint?: string;
  success?: string;
  required?: boolean;
  className?: string;
  children: (control: FieldControl) => ReactNode;
}

export function Field({ label, error, hint, success, required = false, className, children }: FieldProps) {
  const { t } = useI18n();
  const id = useId();
  const messageId = error || success || hint ? `${id}-message` : undefined;
  const invalid = Boolean(error);
  const valid = Boolean(success && !error);
  const context: FieldControlContextValue = {
    id, invalid, valid, describedBy: messageId, errorId: error ? messageId : undefined, required,
  };

  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className="block text-sm font-medium text-content-strong">
        {label}
        {required && (
          <>
            <span className="ml-0.5 text-danger" aria-hidden="true">*</span>
            <span className="sr-only"> ({t('validation.required')})</span>
          </>
        )}
      </label>
      <FieldControlContext.Provider value={context}>{children({ id, invalid, valid, describedBy: messageId })}</FieldControlContext.Provider>
      {error ? (
        <p id={messageId} role="alert" className="text-xs font-medium text-danger">{error}</p>
      ) : success ? (
        <p id={messageId} role="status" className="text-xs font-medium text-positive">{success}</p>
      ) : hint ? (
        <p id={messageId} className="text-xs text-content-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export { Field as FormField, Input as TextInput, Textarea as TextArea, Select };
