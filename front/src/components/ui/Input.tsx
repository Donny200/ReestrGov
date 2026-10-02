import { forwardRef, useContext, useId, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { CheckIcon } from 'lucide-react';
import { cn } from '../../lib/cn';
import { FieldControlContext, type FieldControlContextValue } from './fieldContext';

export const controlClass =
  'w-full rounded-control border border-line bg-surface/90 px-3.5 text-sm text-content-strong shadow-xs transition-[border-color,box-shadow,background-color] duration-fast placeholder:text-content-subtle hover:border-line-strong focus-visible:border-focus focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/30 disabled:cursor-not-allowed disabled:bg-surface-subtle disabled:opacity-70';

interface ControlStateProps {
  invalid?: boolean;
  valid?: boolean;
  describedBy?: string;
}

interface ControlInput extends ControlStateProps {
  id?: string;
  required?: boolean;
  'aria-describedby'?: string;
  'aria-errormessage'?: string;
}

function resolveControl(field: FieldControlContextValue | null, input: ControlInput) {
  const invalid = input.invalid ?? field?.invalid ?? false;
  const valid = input.valid ?? field?.valid ?? false;
  return {
    attributes: {
      id: input.id ?? field?.id,
      required: input.required ?? field?.required,
      'aria-invalid': invalid || undefined,
      'aria-describedby': input['aria-describedby'] ?? input.describedBy ?? field?.describedBy,
      'aria-errormessage': input['aria-errormessage'] ?? (invalid ? field?.errorId : undefined),
    },
    stateClass: invalid
      ? 'border-danger focus-visible:border-danger focus-visible:ring-danger/25'
      : valid
        ? 'border-positive focus-visible:border-positive focus-visible:ring-positive/25'
        : undefined,
  };
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement>, ControlStateProps {}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { invalid, valid, describedBy, className, id, required, ...rest },
  ref,
) {
  const field = useContext(FieldControlContext);
  const { attributes, stateClass } = resolveControl(field, {
    id, invalid, valid, describedBy, required,
    'aria-describedby': rest['aria-describedby'],
    'aria-errormessage': rest['aria-errormessage'],
  });
  return <input ref={ref} {...rest} {...attributes} className={cn(controlClass, 'h-10', stateClass, className)} />;
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement>, ControlStateProps {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { invalid, valid, describedBy, className, id, required, ...rest },
  ref,
) {
  const field = useContext(FieldControlContext);
  const { attributes, stateClass } = resolveControl(field, {
    id, invalid, valid, describedBy, required,
    'aria-describedby': rest['aria-describedby'],
    'aria-errormessage': rest['aria-errormessage'],
  });
  return (
    <textarea
      ref={ref}
      {...rest}
      {...attributes}
      className={cn(controlClass, 'min-h-24 resize-y py-2.5 leading-relaxed', stateClass, className)}
    />
  );
});

export const Checkbox = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Checkbox(
  { className, ...props },
  ref,
) {
  return (
    <span className={cn('relative inline-flex h-4 w-4 shrink-0', className)}>
      <input
        ref={ref}
        type="checkbox"
        className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-line-strong bg-surface transition-colors duration-fast checked:border-brand checked:bg-brand focus-visible:ring-2 focus-visible:ring-focus/40 disabled:cursor-not-allowed disabled:opacity-50"
        {...props}
      />
      <CheckIcon className="pointer-events-none absolute inset-0 m-auto h-3 w-3 text-brand-fg opacity-0 transition-opacity peer-checked:opacity-100" aria-hidden="true" />
    </span>
  );
});

export interface FloatingInputProps extends InputProps {
  label: string;
  error?: string;
  hint?: string;
}

export const FloatingInput = forwardRef<HTMLInputElement, FloatingInputProps>(function FloatingInput(
  { label, error, hint, className, id, ...props },
  ref,
) {
  const generated = useId();
  const inputId = id ?? generated;
  const messageId = error || hint ? `${inputId}-message` : undefined;
  return (
    <div className="space-y-1.5">
      <div className="relative">
        <Input
          ref={ref}
          id={inputId}
          {...props}
          invalid={Boolean(error) || props.invalid}
          aria-describedby={messageId}
          placeholder=" "
          className={cn('peer h-14 pb-1.5 pt-5', className)}
        />
        <label
          htmlFor={inputId}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-content-muted transition-all duration-fast peer-focus:top-2.5 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:font-medium peer-focus:text-link peer-[:not(:placeholder-shown)]:top-2.5 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:font-medium"
        >
          {label}
        </label>
      </div>
      {error ? (
        <p id={messageId} role="alert" className="text-xs font-medium text-danger">{error}</p>
      ) : hint ? (
        <p id={messageId} className="text-xs text-content-muted">{hint}</p>
      ) : null}
    </div>
  );
});
