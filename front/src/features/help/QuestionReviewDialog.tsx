import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessagesSquareIcon, SendIcon, UserCheckIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Badge, StatusPill } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Field } from '../../components/ui/Field';
import { Textarea } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { SkeletonText } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/States';
import { useAuth } from '../../contexts/auth';
import { useI18n } from '../../contexts/i18n';
import { cn } from '../../lib/cn';
import { InlineAlert } from '../functions/InlineAlert';
import type { HelpConversationSummary } from '../../types/help';
import { errorMessage, fieldErrorsOf } from '../../utils/errors';
import { formatDateTime } from '../../utils/format';
import { HELP_MESSAGE_MAX, HELP_REPLY_PERMISSION, helpStatusLabel, helpStatusTones } from './helpOptions';
import { useHelpAssign, useHelpCandidates, useHelpInboxDetail, useHelpReply, useHelpStatus } from './queries';

interface QuestionReviewDialogProps {
  conversation: HelpConversationSummary | null;
  organizationName: (id: number | null | undefined) => string;
  onClose: () => void;
}

export function QuestionReviewDialog({ conversation, organizationName, onClose }: QuestionReviewDialogProps) {
  const { t, locale } = useI18n();
  const { user, hasPermission } = useAuth();
  const id = conversation?.id ?? null;
  const detail = useHelpInboxDetail(id);
  const canReply = hasPermission(HELP_REPLY_PERMISSION);
  const candidates = useHelpCandidates(id, canReply);
  const reply = useHelpReply();
  const status = useHelpStatus();
  const assign = useHelpAssign();
  const [text, setText] = useState('');
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    setText('');
    setError(undefined);
  }, [id]);

  const current = detail.data?.conversation ?? conversation;
  const busy = reply.isPending || status.isPending || assign.isPending;
  const closed = current?.status === 'CLOSED';

  const send = async () => {
    if (!id) return;
    if (!text.trim()) {
      setError(t('help.replyRequired', 'Write a reply'));
      return;
    }
    try {
      await reply.mutateAsync({ id, message: text.trim() });
      setText('');
      setError(undefined);
      toast.success(t('help.replySent', 'Reply sent'));
    } catch (failure) {
      setError(fieldErrorsOf(failure).message ?? errorMessage(failure, t));
    }
  };

  const move = async (target: 'IN_PROGRESS' | 'CLOSED') => {
    if (!id) return;
    try {
      await status.mutateAsync({ id, status: target });
      toast.success(target === 'CLOSED' ? t('help.closed', 'Conversation closed') : t('help.markedInProgress', 'Marked as in progress'));
    } catch (failure) {
      toast.error(errorMessage(failure, t));
    }
  };

  const chooseAssignee = async (value: string) => {
    if (!id) return;
    try {
      await assign.mutateAsync({ id, userId: value ? Number(value) : null });
      toast.success(t('help.assigneeSaved', 'Responsible staff member updated'));
    } catch (failure) {
      toast.error(fieldErrorsOf(failure).userId ?? errorMessage(failure, t));
    }
  };

  const subject = current ? (current.general ? t('help.generalQuestionShort', 'General question') : current.serviceName ?? `#${current.serviceId}`) : '';

  return (
    <Modal
      open={conversation !== null}
      onClose={onClose}
      closeDisabled={busy}
      size="lg"
      icon={<MessagesSquareIcon aria-hidden="true" />}
      title={subject}
      description={current ? `#${current.id} · ${current.general ? t('help.supportInbox', 'Site support inbox') : organizationName(current.organizationId)}` : undefined}
      footer={<Button variant="outline" onClick={onClose} disabled={busy}>{t('action.close', 'Close')}</Button>}
    >
      {detail.isPending ? (
        <SkeletonText lines={6} />
      ) : detail.error ? (
        <ErrorState error={detail.error} onRetry={() => void detail.refetch()} />
      ) : detail.data && current ? (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill tone={helpStatusTones[current.status]}>{helpStatusLabel(current.status, t)}</StatusPill>
            {current.serviceId && (
              <Link to={`/functions/${current.serviceId}`} target="_blank" className="text-sm font-medium text-accent-text underline-offset-4 fine:hover:underline">
                {t('help.openServicePage', 'Open the public service page')}
              </Link>
            )}
            {current.language && <Badge size="sm">{current.language.toUpperCase()}</Badge>}
            <Badge size="sm">{current.notificationRequested ? t('help.notifyRequested', 'E-mail notification requested') : t('help.notifyNone', 'No notification: the visitor checks the private link')}</Badge>
          </div>

          <InlineAlert tone="info">
            {t('help.staffNotice', 'The visitor sees replies signed by the organization, not your name. Never ask for passwords, identity numbers or documents; point to the published service page where possible.')}
          </InlineAlert>

          <ol className="max-h-[22rem] space-y-3 overflow-y-auto pe-1" aria-label={t('help.messages', 'Messages')}>
            {detail.data.messages.map((message) => (
              <li key={message.id} className={cn('rounded-card-sm border p-4', message.author === 'STAFF' ? 'border-accent/40 bg-surface sm:ms-10' : 'border-line')}>
                <p className="flex flex-wrap items-baseline justify-between gap-2 text-xs text-secondary">
                  <span className="font-semibold text-foreground">
                    {message.author === 'STAFF' ? `${t('help.staffReply', 'Reply')} · ${message.staffLabel ?? ''}` : t('help.visitor', 'Visitor')}
                  </span>
                  <time dateTime={message.createdAt} className="tabular-nums">{formatDateTime(message.createdAt, locale)}</time>
                </p>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-foreground wrap-anywhere">{message.body}</p>
              </li>
            ))}
          </ol>

          {canReply && (
            <div className="space-y-4 border-t border-line pt-5">
              <Field label={t('help.assignee', 'Responsible staff member')}>
                {(control) => (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Select
                      {...control}
                      size="sm"
                      disabled={busy || candidates.isPending}
                      value={current.assignedUserId ? String(current.assignedUserId) : ''}
                      onValueChange={(value) => void chooseAssignee(value)}
                      options={[
                        { value: '', label: t('help.unassigned', 'Nobody assigned') },
                        ...(candidates.data ?? []).map((member) => ({
                          value: String(member.id),
                          label: [member.firstName, member.lastName].filter(Boolean).join(' ') || member.email,
                        })),
                        ...(current.assignedUserId && !(candidates.data ?? []).some((member) => member.id === current.assignedUserId)
                          ? [{ value: String(current.assignedUserId), label: current.assignedUserName ?? `#${current.assignedUserId}` }]
                          : []),
                      ]}
                    />
                    {user && current.assignedUserId !== user.id && (
                      <Button variant="outline" size="sm" icon={<UserCheckIcon />} disabled={busy} onClick={() => void chooseAssignee(String(user.id))}>
                        {t('help.assignMe', 'Assign to me')}
                      </Button>
                    )}
                  </div>
                )}
              </Field>

              {closed ? (
                <InlineAlert tone="info" action={<Button variant="outline" size="sm" disabled={busy} onClick={() => void move('IN_PROGRESS')}>{t('help.reopen', 'Reopen')}</Button>}>
                  {t('help.closedNotice', 'This conversation is closed. Reopen it to reply.')}
                </InlineAlert>
              ) : (
                <>
                  <Field label={t('help.reply', 'Reply to the visitor')} error={error} hint={t('help.replyHint', 'Answer only with information you can confirm. The visitor reads it through their private link.')}>
                    {(control) => <Textarea {...control} rows={5} maxLength={HELP_MESSAGE_MAX} value={text} onChange={(event) => setText(event.target.value)} />}
                  </Field>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="dark" size="sm" icon={<SendIcon />} loading={reply.isPending} disabled={busy && !reply.isPending} onClick={() => void send()}>
                      {t('help.sendReply', 'Send reply')}
                    </Button>
                    {current.status !== 'IN_PROGRESS' && (
                      <Button variant="outline" size="sm" disabled={busy} onClick={() => void move('IN_PROGRESS')}>{t('help.markInProgress', 'Mark in progress')}</Button>
                    )}
                    <Button variant="ghost" size="sm" disabled={busy} onClick={() => void move('CLOSED')}>{t('help.close', 'Close conversation')}</Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      ) : null}
    </Modal>
  );
}
