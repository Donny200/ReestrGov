import React from 'react';
import { twMerge } from 'tailwind-merge';
import { SkeletonRows } from './Skeleton';
import { EmptyState, ErrorState } from './States';

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  loading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  emptyTitle: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  caption?: string;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading,
  error,
  onRetry,
  emptyTitle,
  emptyDescription,
  emptyAction,
  caption
}: DataTableProps<T>) {
  if (loading) return <SkeletonRows rows={5} columns={Math.min(columns.length, 6)} />;
  if (error) return <ErrorState error={error} onRetry={onRetry} />;
  if (rows.length === 0)
  return <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-left text-sm">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className="border-b border-navy-100 bg-navy-50/60">
            {columns.map((column) =>
            <th
              key={column.key}
              scope="col"
              className={twMerge(
                'px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-navy-500 sm:px-6',
                column.headerClassName
              )}>
              
                {column.header}
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-navy-100">
          {rows.map((row) =>
          <tr key={rowKey(row)} className="transition-colors hover:bg-navy-50/40">
              {columns.map((column) =>
            <td key={column.key} className={twMerge('px-4 py-3.5 align-middle text-navy-700 sm:px-6', column.className)}>
                  {column.render(row)}
                </td>
            )}
            </tr>
          )}
        </tbody>
      </table>
    </div>);

}