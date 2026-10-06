import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

interface ActionBarProps {
  children: ReactNode;
  status?: ReactNode;
  className?: string;
}

export function ActionBar({ children, status, className }: ActionBarProps) {
  return (
    <div
      className={cn(
        'sticky bottom-0 z-20 -mx-5 mt-6 flex flex-col-reverse gap-3 border-t border-line bg-background/95 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:-mx-8 sm:flex-row sm:items-center sm:justify-between sm:px-8',
        className,
      )}
    >
      <div className="min-h-6 text-sm text-secondary">{status}</div>
      <div className="flex flex-wrap items-center gap-2 [&>*]:flex-1 sm:[&>*]:flex-none">{children}</div>
    </div>
  );
}
