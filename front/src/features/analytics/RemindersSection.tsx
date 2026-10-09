import { Link } from 'react-router-dom';
import { BellIcon, CheckIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { SkeletonText } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/States';
import { useAuth } from '../../contexts/auth';
import { useI18n } from '../../contexts/i18n';
import { errorMessage } from '../../utils/errors';
import { formatDate } from '../../utils/format';
import { localizedText } from '../../utils/translations';
import { useAcknowledgeReminder, useReminders } from './queries';
import { editorPath, issueLabel } from './qualityIssues';

interface RemindersSectionProps {
  organizationId?: number;
  categoryId?: number;
}

export function RemindersSection({ organizationId, categoryId }: RemindersSectionProps) {
  const { t, locale } = useI18n();
  const { hasPermission } = useAuth();
  const reminders = useReminders({ organizationId, categoryId });
  const acknowledge = useAcknowledgeReminder();
  const items = reminders.data ?? [];
  const canOpenEditor = hasPermission('FUNCTIONS_VIEW');

  if (!reminders.isPending && !reminders.error && items.length === 0) return null;

  return (
    <section id="reminders" aria-label={t('reminders.title', 'Reminders')} className="scroll-mt-24">
      <Card>
        <CardHeader
          icon={<BellIcon />}
          title={t('reminders.title', 'Reminders')}
          description={t('reminders.subtitle', 'Created by a daily check. An acknowledged reminder returns after 14 days if the issue is still open.')}
        />
        {reminders.isPending ? (
          <div className="px-5 py-5"><SkeletonText lines={3} /></div>
        ) : reminders.error ? (
          <ErrorState error={reminders.error} onRetry={() => void reminders.refetch()} />
        ) : (
          <ul className="divide-y divide-line">
            {items.map((reminder) => {
              const name = localizedText(reminder.functionName, reminder.functionNameTranslations ?? undefined, locale) ?? reminder.functionName ?? `#${reminder.functionId}`;
              return (
                <li key={reminder.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground wrap-anywhere">{name}</p>
                    <p className="mt-0.5 text-sm text-secondary">
                      {issueLabel(reminder.issue, t)} · <span className="tabular-nums">{t('reminders.detected', 'Detected:')} {formatDate(reminder.detectedAt, locale)}</span>
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {canOpenEditor && (
                      <Link to={editorPath(reminder.functionId, reminder.issue)} className="inline-flex min-h-9 items-center rounded-pill px-3 text-sm font-medium text-accent-text underline-offset-4 fine:hover:underline">
                        {t('quality.fixInEditor', 'Fix in editor')}
                        <span className="sr-only">: {name}</span>
                      </Link>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<CheckIcon />}
                      loading={acknowledge.isPending && acknowledge.variables === reminder.id}
                      disabled={acknowledge.isPending}
                      onClick={() =>
                        acknowledge.mutate(reminder.id, {
                          onSuccess: () => toast.success(t('reminders.acknowledged', 'Reminder hidden for 14 days')),
                          onError: (error) => toast.error(errorMessage(error, t)),
                        })
                      }
                    >
                      {t('reminders.acknowledge', 'Acknowledge')}
                      <span className="sr-only">: {name}</span>
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </section>
  );
}
