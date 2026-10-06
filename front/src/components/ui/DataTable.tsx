import { useMemo, useState, type ReactNode } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type RowData,
  type SortingState,
} from '@tanstack/react-table';
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { cn } from '../../lib/cn';
import { useI18n } from '../../contexts/i18n';
import { Button } from './Button';
import { SkeletonRows } from './Skeleton';
import { EmptyState, ErrorState } from './States';

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    className?: string;
    headerClassName?: string;
    hideBelow?: 'sm' | 'md' | 'lg' | 'xl';
    align?: 'left' | 'right';
    mobileHidden?: boolean;
  }
}

const hiddenBelow = {
  sm: 'hidden sm:table-cell',
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
  xl: 'hidden xl:table-cell',
} as const;

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
  headerClassName?: string;
}

interface SharedProps<T> {
  rowKey: (row: T) => string | number;
  caption?: string;
  loading?: boolean;
  error?: unknown;
  onRetry?: () => void;
}

export interface DataTableProps<T> extends SharedProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  empty: { title: string; description?: string; action?: ReactNode };
  pageSize?: number;
  initialSorting?: SortingState;
}

export interface LegacyDataTableProps<T> extends SharedProps<T> {
  columns: Column<T>[];
  rows: T[];
  emptyTitle: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
}

function legacyColumns<T>(columns: Column<T>[]): ColumnDef<T>[] {
  return columns.map((column) => ({
    id: column.key,
    header: column.header,
    enableSorting: false,
    cell: ({ row }) => column.render(row.original),
    meta: {
      className: column.className,
      headerClassName: column.headerClassName,
      mobileHidden: column.className?.split(/\s+/).includes('hidden') ?? false,
    },
  }));
}

export function DataTable<T>(props: DataTableProps<T> | LegacyDataTableProps<T>) {
  const legacy = 'rows' in props;
  const sourceColumns = props.columns;
  const columns = useMemo(
    () => (legacy ? legacyColumns(sourceColumns as Column<T>[]) : (sourceColumns as ColumnDef<T>[])),
    [legacy, sourceColumns],
  );
  const data = legacy ? (props as LegacyDataTableProps<T>).rows : (props as DataTableProps<T>).data;
  const empty = legacy
    ? {
        title: (props as LegacyDataTableProps<T>).emptyTitle,
        description: (props as LegacyDataTableProps<T>).emptyDescription,
        action: (props as LegacyDataTableProps<T>).emptyAction,
      }
    : (props as DataTableProps<T>).empty;
  const pageSize = legacy ? undefined : (props as DataTableProps<T>).pageSize ?? 25;
  const initialSorting = legacy ? [] : (props as DataTableProps<T>).initialSorting ?? [];

  return (
    <TableView
      columns={columns}
      data={data}
      rowKey={props.rowKey}
      caption={props.caption}
      loading={props.loading}
      error={props.error}
      onRetry={props.onRetry}
      empty={empty}
      pageSize={pageSize}
      initialSorting={initialSorting}
    />
  );
}

interface TableViewProps<T> extends SharedProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  empty: { title: string; description?: string; action?: ReactNode };
  pageSize: number | undefined;
  initialSorting: SortingState;
}

function TableView<T>({ columns, data, rowKey, caption, loading = false, error, onRetry, empty, pageSize, initialSorting }: TableViewProps<T>) {
  const { t } = useI18n();
  const [sorting, setSorting] = useState<SortingState>(initialSorting);
  const paginate = pageSize !== undefined;
  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getRowId: (row) => String(rowKey(row)),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    ...(paginate ? { getPaginationRowModel: getPaginationRowModel() } : {}),
    initialState: paginate ? { pagination: { pageSize } } : undefined,
  });

  if (loading) return <SkeletonRows rows={6} columns={Math.min(columns.length, 6)} />;
  if (error) return <ErrorState error={error} onRetry={onRetry} />;
  if (data.length === 0) return <EmptyState title={empty.title} description={empty.description} action={empty.action} />;

  const rows = table.getRowModel().rows;
  const total = table.getPrePaginationRowModel().rows.length;
  const { pageIndex, pageSize: size } = table.getState().pagination;
  const from = pageIndex * size + 1;
  const to = Math.min(total, (pageIndex + 1) * size);

  return (
    <div>
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full border-collapse text-left text-sm">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead className="bg-surface-subtle/60">
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id} className="border-b border-line">
                {group.headers.map((header) => {
                  const meta = header.column.columnDef.meta;
                  const sorted = header.column.getIsSorted();
                  const label = flexRender(header.column.columnDef.header, header.getContext());
                  return (
                    <th
                      key={header.id}
                      scope="col"
                      aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : undefined}
                      className={cn(
                        'h-11 px-4 text-xs font-semibold uppercase tracking-wide text-content-muted first:pl-5 last:pr-5',
                        meta?.hideBelow && hiddenBelow[meta.hideBelow],
                        meta?.align === 'right' && 'text-right',
                        meta?.headerClassName,
                      )}
                    >
                      {header.isPlaceholder ? null : header.column.getCanSort() ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className={cn('inline-flex items-center gap-1.5 rounded transition-colors hover:text-content-strong', meta?.align === 'right' && 'flex-row-reverse')}
                        >
                          {label}
                          {sorted === 'asc' ? (
                            <ArrowUpIcon className="h-3.5 w-3.5 text-link" aria-hidden="true" />
                          ) : sorted === 'desc' ? (
                            <ArrowDownIcon className="h-3.5 w-3.5 text-link" aria-hidden="true" />
                          ) : (
                            <ArrowUpDownIcon className="h-3.5 w-3.5 opacity-40" aria-hidden="true" />
                          )}
                        </button>
                      ) : label}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-line/80">
            {rows.map((row) => (
              <tr key={row.id} className="transition-colors duration-fast hover:bg-brand-subtle/40">
                {row.getVisibleCells().map((cell) => {
                  const meta = cell.column.columnDef.meta;
                  return (
                    <td
                      key={cell.id}
                      className={cn(
                        'px-4 py-3 align-middle text-content first:pl-5 last:pr-5',
                        meta?.hideBelow && hiddenBelow[meta.hideBelow],
                        meta?.align === 'right' && 'text-right',
                        meta?.className,
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-line/80 lg:hidden" role="region" aria-label={caption}>
        {rows.map((row) => (
          <dl key={row.id} className="grid gap-2.5 px-4 py-4">
            {row.getVisibleCells()
              .filter((cell) => !cell.column.columnDef.meta?.mobileHidden)
              .map((cell) => {
                const header = cell.column.columnDef.header;
                return (
                  <div key={cell.id} className="grid grid-cols-[6.5rem_minmax(0,1fr)] items-start gap-3">
                    <dt className="pt-0.5 text-xs font-semibold uppercase tracking-wide text-content-muted">
                      {typeof header === 'string' ? header : cell.column.id}
                    </dt>
                    <dd className="min-w-0 break-words text-sm text-content">{flexRender(cell.column.columnDef.cell, cell.getContext())}</dd>
                  </div>
                );
              })}
          </dl>
        ))}
      </div>

      {paginate && total > size && (
        <div className="flex flex-col gap-3 border-t border-line/80 px-5 py-3 text-sm text-content-muted sm:flex-row sm:items-center sm:justify-between">
          <p aria-live="polite" className="tabular-nums">{from}–{to} / {total}</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()} icon={<ChevronLeftIcon />}>
              {t('fnAdmin.previous', 'Previous')}
            </Button>
            <span className="tabular-nums">{pageIndex + 1} / {table.getPageCount()}</span>
            <Button variant="outline" size="sm" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}>
              {t('fnAdmin.next', 'Next')}
              <ChevronRightIcon aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
