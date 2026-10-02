import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

interface CardProps {
  className?: string;
  children: ReactNode;
  glass?: boolean;
  hover?: boolean;
}

export function Card({ className, children, glass = false, hover = false }: CardProps) {
  return (
    <section
      className={cn(
        'rounded-surface border border-line bg-surface shadow-card',
        glass && 'glass shadow-surface',
        hover && 'lift',
        className,
      )}
    >
      {children}
    </section>
  );
}

interface CardHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function CardHeader({ title, description, actions, icon, className }: CardHeaderProps) {
  return (
    <header className={cn('flex flex-col gap-3 border-b border-line/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between', className)}>
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-brand-gradient-soft text-link" aria-hidden="true">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <h2 className="font-display text-sm font-semibold text-content-strong">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-content-muted">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function CardBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('px-5 py-5', className)}>{children}</div>;
}

export function CardFooter({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <footer className={cn('flex flex-wrap items-center justify-end gap-2 border-t border-line/80 bg-surface-subtle/50 px-5 py-3', className)}>
      {children}
    </footer>
  );
}

export { Card as Panel, CardHeader as PanelHeader, CardBody as PanelBody };
