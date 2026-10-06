import * as RadixSelect from '@radix-ui/react-select';
import { forwardRef, useContext, type ReactNode } from 'react';
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { cn } from '../../lib/cn';
import { FieldControlContext } from './fieldContext';
import { menuItemClass, menuSurfaceClass } from './menuStyles';

const EMPTY_VALUE = '__select_empty__';

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  id?: string;
  name?: string;
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean;
  valid?: boolean;
  describedBy?: string;
  className?: string;
  contentClassName?: string;
  align?: 'start' | 'center' | 'end';
  variant?: 'field' | 'glass';
  leadingIcon?: ReactNode;
  onBlur?: () => void;
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

const toInternal = (value: string) => (value === '' ? EMPTY_VALUE : value);
const fromInternal = (value: string) => (value === EMPTY_VALUE ? '' : value);

const triggerVariants = {
  field: 'border-line bg-surface/80 shadow-xs backdrop-blur-md hover:border-line-strong hover:bg-surface',
  glass: 'border-line/80 bg-surface/60 shadow-xs backdrop-blur-md hover:border-line-strong hover:bg-surface/90',
};

const iconSlotClass = 'shrink-0 text-content-muted [&>svg]:h-4 [&>svg]:w-4';

export const Select = forwardRef<HTMLButtonElement, SelectProps>(function Select(
  {
    value,
    onValueChange,
    options,
    placeholder,
    id,
    name,
    disabled,
    required,
    invalid,
    valid,
    describedBy,
    className,
    contentClassName,
    align = 'start',
    variant = 'field',
    leadingIcon,
    onBlur,
    ...aria
  },
  ref,
) {
  const field = useContext(FieldControlContext);
  const isInvalid = invalid ?? field?.invalid ?? false;
  const isValid = !isInvalid && (valid ?? field?.valid ?? false);
  const hasEmptyOption = options.some((option) => option.value === '');
  const internalValue = value === '' && !hasEmptyOption ? '' : toInternal(value);
  const selected = options.find((option) => option.value === value);

  return (
    <RadixSelect.Root
      value={internalValue}
      onValueChange={(next) => onValueChange(fromInternal(next))}
      disabled={disabled}
      required={required ?? field?.required}
      name={name}
    >
      <RadixSelect.Trigger
        ref={ref}
        id={id ?? field?.id}
        aria-invalid={isInvalid || undefined}
        aria-describedby={describedBy ?? field?.describedBy}
        aria-errormessage={isInvalid ? field?.errorId : undefined}
        onBlur={onBlur}
        className={cn(
          'group inline-flex h-10 w-full items-center gap-2 rounded-control border px-3.5 text-left text-sm text-content-strong transition-[border-color,box-shadow,background-color] duration-fast focus-visible:border-focus focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/30 data-[state=open]:border-focus data-[state=open]:ring-2 data-[state=open]:ring-focus/25 data-[placeholder]:text-content-muted disabled:cursor-not-allowed disabled:bg-surface-subtle disabled:opacity-70',
          triggerVariants[variant],
          isInvalid && 'border-danger focus-visible:border-danger focus-visible:ring-danger/25 data-[state=open]:border-danger data-[state=open]:ring-danger/25',
          isValid && 'border-positive focus-visible:border-positive focus-visible:ring-positive/25 data-[state=open]:border-positive data-[state=open]:ring-positive/25',
          className,
        )}
        {...aria}
      >
        {leadingIcon && <span className={iconSlotClass} aria-hidden="true">{leadingIcon}</span>}
        <span className="min-w-0 flex-1 truncate">
          <RadixSelect.Value placeholder={placeholder}>{selected?.label ?? (value || undefined)}</RadixSelect.Value>
        </span>
        <RadixSelect.Icon asChild>
          <ChevronDownIcon
            className="h-4 w-4 shrink-0 text-content-muted transition-transform duration-base ease-spring group-data-[state=open]:rotate-180"
            aria-hidden="true"
          />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>
      <RadixSelect.Portal>
        <RadixSelect.Content
          position="popper"
          align={align}
          sideOffset={6}
          collisionPadding={12}
          className={cn(
            menuSurfaceClass,
            'min-w-[var(--radix-select-trigger-width)] max-w-[min(var(--radix-select-content-available-width),28rem)] origin-[var(--radix-select-content-transform-origin)]',
            contentClassName,
          )}
        >
          <RadixSelect.ScrollUpButton className="flex h-6 cursor-default items-center justify-center text-content-muted">
            <ChevronUpIcon className="h-4 w-4" aria-hidden="true" />
          </RadixSelect.ScrollUpButton>
          <RadixSelect.Viewport className="max-h-[min(var(--radix-select-content-available-height),22rem)]">
            {options.map((option) => (
              <RadixSelect.Item
                key={option.value}
                value={toInternal(option.value)}
                disabled={option.disabled}
                data-value={option.value}
                className={cn(menuItemClass, 'pr-9 data-[state=checked]:font-medium')}
              >
                {option.icon && <span className={iconSlotClass} aria-hidden="true">{option.icon}</span>}
                <span className="block min-w-0 flex-1 truncate">
                  <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
                </span>
                {option.description && <span className="shrink-0 text-xs text-content-muted">{option.description}</span>}
                <RadixSelect.ItemIndicator className="absolute right-2.5 inline-flex h-4 w-4 items-center justify-center text-link">
                  <CheckIcon className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
                </RadixSelect.ItemIndicator>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
          <RadixSelect.ScrollDownButton className="flex h-6 cursor-default items-center justify-center text-content-muted">
            <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
          </RadixSelect.ScrollDownButton>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
});
