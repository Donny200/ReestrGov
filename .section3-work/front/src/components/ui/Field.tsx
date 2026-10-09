import React, { useId } from 'react';
import { twMerge } from 'tailwind-merge';

interface FieldProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: (props: {id: string;invalid: boolean;describedBy: string | undefined;}) => React.ReactNode;
  className?: string;
}

export function Field({ label, error, hint, required, children, className }: FieldProps) {
  const id = useId();
  const messageId = error || hint ? `${id}-message` : undefined;

  return (
    <div className={twMerge('space-y-1.5', className)}>
      <label htmlFor={id} className="block text-[13px] font-medium text-navy-700">
        {label}
        {required && <span className="ml-1 text-red-600">*</span>}
      </label>
      {children({ id, invalid: Boolean(error), describedBy: messageId })}
      {error ?
      <p id={messageId} className="text-[12px] font-medium text-red-600">
          {error}
        </p> :
      hint ?
      <p id={messageId} className="text-[12px] text-navy-400">
          {hint}
        </p> :
      null}
    </div>);

}

const controlBase =
'w-full rounded-lg border bg-white px-3 text-sm text-navy-900 placeholder:text-navy-300 transition-colors disabled:bg-navy-50 disabled:text-navy-400';

export const inputClass = (invalid?: boolean): string =>
twMerge(controlBase, 'h-11', invalid ? 'border-red-400' : 'border-navy-200 hover:border-navy-300');

export const textareaClass = (invalid?: boolean): string =>
twMerge(controlBase, 'py-2.5 leading-relaxed', invalid ? 'border-red-400' : 'border-navy-200 hover:border-navy-300');

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export function TextInput({ invalid, className, ...rest }: TextInputProps) {
  return <input className={twMerge(inputClass(invalid), className)} aria-invalid={invalid} {...rest} />;
}

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export function TextArea({ invalid, className, ...rest }: TextAreaProps) {
  return <textarea className={twMerge(textareaClass(invalid), className)} aria-invalid={invalid} {...rest} />;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export function Select({ invalid, className, children, ...rest }: SelectProps) {
  return (
    <select className={twMerge(inputClass(invalid), 'pr-8', className)} aria-invalid={invalid} {...rest}>
      {children}
    </select>);

}