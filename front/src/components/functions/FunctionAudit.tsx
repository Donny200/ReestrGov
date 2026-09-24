import { useAsync } from '../../hooks/useAsync';
import { useI18n } from '../../contexts/i18n';
import { getFunctionAudit } from '../../services/adminFunctionService';
import { Panel, PanelHeader, PanelBody } from '../ui/Card';
import { ErrorState, LoadingState, EmptyState } from '../ui/States';
import { Button } from '../ui/Button';
import type { AdminFunction } from '../../types/adminFunctions';

export function FunctionAudit({ record }: { record: AdminFunction }) {
  const { t, locale } = useI18n();
  const history = useAsync(() => getFunctionAudit(record.id), [record]);
  return <Panel className="mt-5">
    <PanelHeader title={t('fnAdmin.audit')} actions={<Button variant="ghost" disabled={history.loading} onClick={history.reload}>{t('fnAdmin.refresh')}</Button>} />
    <PanelBody>
      {history.loading ? <LoadingState /> : history.error ? <ErrorState error={history.error} onRetry={history.reload} /> :
        !history.data?.length ? <EmptyState title={t('state.emptyTitle')} /> :
        <ol className="space-y-5">{history.data.map(entry => <li key={entry.id} className="border-l-2 border-teal-200 pl-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <strong className="text-sm">{entry.action}</strong>
            <time className="text-xs text-content-muted" dateTime={entry.performedAt}>
              {new Date(entry.performedAt).toLocaleString(locale)}
            </time>
          </div>
          <p className="mt-1 text-sm">{t('fnAdmin.actor')}: {entry.performedBy}</p>
          <p className="mt-1 whitespace-pre-wrap break-words text-sm text-content-muted">{entry.details}</p>
        </li>)}</ol>}
    </PanelBody>
  </Panel>;
}
