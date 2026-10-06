import { ArrowLeftIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export function BackLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="group inline-flex min-h-10 items-center gap-2 rounded-control pr-3 text-sm font-medium text-content-muted transition-colors duration-fast hover:text-content-strong"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface shadow-xs transition-colors duration-fast group-hover:border-brand/40 group-hover:bg-brand-subtle group-hover:text-link">
        <ArrowLeftIcon className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
      </span>
      {label}
    </Link>
  );
}
