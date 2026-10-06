import { HistoryIcon, RefreshCwIcon } from 'lucide-react';
import { useI18n } from '../../contexts/i18n';
import { useFunctionAudit } from '../../features/functions/queries';
import { FunctionErrorState } from '../../features/functions/FunctionErrorState';
import { Card, CardBody, CardHeader } from '../ui/Card';
import { StatusPill, type StatusTone } from '../ui/Badge';
import { Button } from '../ui/Button';
import { SkeletonText } from '../ui/Skeleton';
import { EmptyState } from '../ui/States';

const tones: Record<string, StatusTone> = {
  PUBLISH: 'published',
  REJECT: 'danger',
  DEACTIVATE: 'danger',
  DELETE: 'danger',
  SUBMIT_REVIEW: 'pending',
  SUBMIT_FOR_REVIEW: 'pending',
  REACTIVATE: 'pending',
};

function normalizeAction(action: string): string {
  return action.toUpperCase().replace(/-/g, '_');
}

function humanize(action: string): string {
  const words = action.toLowerCase().split('_').join(' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function formatTimestamp(value: string, locale: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
  } catch {
    return date.toLocaleString();
  }
}

export function FunctionAudit({ functionId }: { functionId: number }) {
  const { t, locale } = useI18n();
  const history = useFunctionAudit(functionId);

  return (
    <Card>
      <CardHeader
        title={t('fnAdmin.audit')}
        icon={<HistoryIcon className="h-4 w-4" />}
        actions={
          <Button variant="ghost" size="sm" icon={<RefreshCwIcon />} disabled={history.isFetching} onClick={() => void history.refetch()}>
            {t('fnAdmin.refresh')}
          </Button>
        }
      />
      <CardBody>
        {history.isPending ? (
          <SkeletonText lines={5} />
        ) : history.error ? (
          <FunctionErrorState error={history.error} onRetry={() => void history.refetch()} />
        ) : !history.data?.length ? (
          <EmptyState title={t('state.emptyTitle')} />
        ) : (
          <ol className="relative space-y-6 border-l border-line pl-6">
            {history.data.map((entry) => {
              const action = normalizeAction(entry.action);
              return (
                <li key={entry.id} className="relative">
                  <span className="absolute -left-[1.95rem] top-1 h-3 w-3 rounded-full bg-brand-gradient ring-4 ring-surface" aria-hidden="true" />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <StatusPill tone={tones[action] ?? 'draft'}>{t(`fnAdmin.action.${action}`, humanize(action))}</StatusPill>
                    <time className="text-xs tabular-nums text-content-muted" dateTime={entry.performedAt}>{formatTimestamp(entry.performedAt, locale)}</time>
                  </div>
                  <p className="mt-1.5 text-sm text-content-strong">{t('fnAdmin.actor')}: {entry.performedBy}</p>
                  {entry.details && <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-content-muted">{entry.details}</p>}
                </li>
              );
            })}
          </ol>
        )}
      </CardBody>
    </Card>
  );
}
