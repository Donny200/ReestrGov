import React from 'react';
import { twMerge } from 'tailwind-merge';

export function Panel({ className, children }: {className?: string;children: React.ReactNode;}) {
  return (
    <section className={twMerge('rounded-xl border border-navy-100 bg-white shadow-card', className)}>
      {children}
    </section>);

}

interface PanelHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PanelHeader({ title, description, actions, className }: PanelHeaderProps) {
  return (
    <header
      className={twMerge(
        'flex flex-col gap-3 border-b border-navy-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6',
        className
      )}>
      
      <div>
        <h2 className="font-display text-base font-semibold text-navy-900">{title}</h2>
        {description && <p className="mt-0.5 text-[13px] text-navy-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>);

}

export function PanelBody({ className, children }: {className?: string;children: React.ReactNode;}) {
  return <div className={twMerge('px-4 py-4 sm:px-6 sm:py-5', className)}>{children}</div>;
}