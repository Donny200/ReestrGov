import type { ReactNode } from 'react';

interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description?: string;
  aside?: ReactNode;
}

export function SectionHeading({ eyebrow, title, description, aside }: SectionHeadingProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-link">{eyebrow}</p>
        <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-content-strong sm:text-4xl">{title}</h2>
        {description && <p className="mt-2 text-sm leading-6 text-content-muted">{description}</p>}
      </div>
      {aside}
    </div>
  );
}
