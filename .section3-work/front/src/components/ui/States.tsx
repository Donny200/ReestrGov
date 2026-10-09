import React from 'react';
import { AlertTriangleIcon, InboxIcon, LockIcon, SearchXIcon } from 'lucide-react';
import { Button } from './Button';
import { errorMessage, statusOf } from '../../utils/errors';

export function EmptyState({
  title,
  description,
  action,
  icon





}: {title: string;description?: string;action?: React.ReactNode;icon?: React.ReactNode;}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-navy-50 text-navy-400">
        {icon ?? <InboxIcon className="h-5 w-5" aria-hidden="true" />}
      </span>
      <h3 className="mt-4 font-display text-base font-semibold text-navy-900">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-navy-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>);

}

export function NoResultsState({ title, description }: {title: string;description?: string;}) {
  return <EmptyState title={title} description={description} icon={<SearchXIcon className="h-5 w-5" />} />;
}

/** Maps 401/403/404/409 and network failures to a friendly state. */
export function ErrorState({ error, onRetry }: {error: unknown;onRetry?: () => void;}) {
  const status = statusOf(error);
  const forbidden = status === 403;
  const notFound = status === 404;

  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <span
        className={`flex h-12 w-12 items-center justify-center rounded-full ${
        forbidden ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}`
        }>
        
        {forbidden ? <LockIcon className="h-5 w-5" /> : <AlertTriangleIcon className="h-5 w-5" />}
      </span>
      <h3 className="mt-4 font-display text-base font-semibold text-navy-900">
        {forbidden ? 'Ruxsat yo‘q' : notFound ? 'Topilmadi' : 'Xatolik yuz berdi'}
      </h3>
      <p className="mt-1 max-w-md text-sm text-navy-500">{errorMessage(error)}</p>
      {onRetry && !forbidden &&
      <Button variant="outline" size="sm" className="mt-5" onClick={onRetry}>
          Qayta urinish
        </Button>
      }
    </div>);

}