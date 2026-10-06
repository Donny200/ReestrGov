import { cva } from 'class-variance-authority';

export const buttonVariants = cva(
  'press inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-control text-sm font-medium transition-[background-color,border-color,color,box-shadow,transform] duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:pointer-events-none disabled:opacity-50 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-brand text-brand-fg shadow-xs hover:bg-brand-hover hover:shadow-glow active:bg-brand-pressed',
        gradient: 'bg-brand-gradient text-white shadow-glow hover:brightness-110',
        secondary: 'bg-surface-subtle text-content-strong hover:bg-line',
        soft: 'bg-brand-subtle text-link hover:bg-brand/15',
        outline: 'border border-line bg-surface/80 text-content-strong shadow-xs hover:border-line-strong hover:bg-surface-subtle',
        ghost: 'text-content hover:bg-surface-subtle hover:text-content-strong',
        danger: 'bg-danger text-white shadow-xs hover:bg-danger/90',
        link: 'h-auto px-0 text-link underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4',
        lg: 'h-11 px-6 text-base',
        icon: 'h-10 w-10',
        iconSm: 'h-8 w-8',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);
