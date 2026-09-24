import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2Icon } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
}

const variants: Record<Variant, string> = {
  primary:
    'border border-brand bg-brand text-content-inverse shadow-sm hover:border-brand-hover hover:bg-brand-hover hover:-translate-y-px active:border-brand-pressed active:bg-brand-pressed',
  secondary:
    'border border-accent bg-accent text-content-inverse shadow-sm hover:border-accent-hover hover:bg-accent-hover hover:-translate-y-px active:border-accent-pressed active:bg-accent-pressed',
  outline:
    'border border-line-strong bg-surface text-content-strong shadow-sm hover:border-brand/30 hover:bg-brand-subtle active:bg-line',
  ghost: 'border border-transparent text-content hover:bg-brand-subtle active:bg-line',
  danger:
    'border border-danger bg-danger text-white shadow-sm hover:bg-red-800 active:bg-red-900'
};

const sizes: Record<Size, string> = {
  sm: 'min-h-11 px-3 text-sm',
  md: 'min-h-11 px-4 text-sm',
  lg: 'min-h-12 px-6 text-base'
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      data-loading={loading || undefined}
      className={twMerge(
        'inline-flex select-none items-center justify-center gap-2 rounded-control font-semibold transition-[background-color,border-color,color,box-shadow,transform] duration-fast focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus/20 active:translate-y-px disabled:pointer-events-none disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-55 motion-reduce:transform-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...rest}>
      
      {loading ? (
        <Loader2Icon className="h-4 w-4 shrink-0 animate-spin motion-reduce:animate-none" aria-hidden="true" />
      ) : icon ? (
        <span className="inline-flex shrink-0" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      {children}
    </button>);

}
