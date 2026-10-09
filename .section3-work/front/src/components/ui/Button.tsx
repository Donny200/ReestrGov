import React from 'react';
import { Loader2Icon } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
}

const variants: Record<Variant, string> = {
  primary: 'bg-navy-800 text-white hover:bg-navy-900 disabled:bg-navy-300',
  secondary: 'bg-teal-600 text-white hover:bg-teal-700 disabled:bg-teal-300',
  outline: 'border border-navy-200 bg-white text-navy-800 hover:border-navy-300 hover:bg-navy-50',
  ghost: 'text-navy-700 hover:bg-navy-100',
  danger: 'border border-red-200 bg-white text-red-700 hover:bg-red-50'
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-[13px]',
  md: 'h-11 px-4 text-sm',
  lg: 'h-12 px-6 text-[15px]'
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
      className={twMerge(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-70',
        variants[variant],
        sizes[size],
        className
      )}
      {...rest}>
      
      {loading ? <Loader2Icon className="h-4 w-4 animate-spin" aria-hidden="true" /> : icon}
      {children}
    </button>);

}