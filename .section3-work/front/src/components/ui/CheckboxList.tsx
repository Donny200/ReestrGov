import React from 'react';
import { twMerge } from 'tailwind-merge';

export interface CheckboxOption {
  value: number;
  label: string;
  description?: string;
  disabled?: boolean;
}

interface CheckboxListProps {
  legend: string;
  options: CheckboxOption[];
  selected: number[];
  onChange: (values: number[]) => void;
  error?: string;
  hint?: string;
  className?: string;
  columns?: 1 | 2;
}

export function CheckboxList({
  legend,
  options,
  selected,
  onChange,
  error,
  hint,
  className,
  columns = 1
}: CheckboxListProps) {
  const toggle = (value: number) => {
    onChange(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]);
  };

  return (
    <fieldset className={twMerge('space-y-2', className)}>
      <legend className="text-[13px] font-medium text-navy-700">
        {legend}
        <span className="ml-1 text-red-600">*</span>
      </legend>
      <div
        className={twMerge(
          'max-h-56 gap-1 overflow-y-auto rounded-lg border p-2',
          columns === 2 ? 'grid sm:grid-cols-2' : 'grid',
          error ? 'border-red-400' : 'border-navy-200'
        )}>
        
        {options.map((option) =>
        <label
          key={option.value}
          className="flex cursor-pointer items-start gap-2.5 rounded-md px-2 py-1.5 text-sm text-navy-700 transition-colors hover:bg-navy-50">
          
            <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-navy-300 text-teal-600 focus:ring-teal-500"
            checked={selected.includes(option.value)}
            disabled={option.disabled}
            onChange={() => toggle(option.value)} />
          
            <span>
              <span className="block leading-tight">{option.label}</span>
              {option.description && <span className="text-[12px] text-navy-400">{option.description}</span>}
            </span>
          </label>
        )}
      </div>
      {error ?
      <p className="text-[12px] font-medium text-red-600">{error}</p> :
      hint ?
      <p className="text-[12px] text-navy-400">{hint}</p> :
      null}
    </fieldset>);

}