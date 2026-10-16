import { useEffect, useId, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BellIcon, BellOffIcon, RefreshCwIcon, SendIcon } from 'lucide-react';
import { SectionHeading } from '../components/home/SectionHeading';
import { StatusPill } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { buttonVariants } from '../components/ui/buttonVariants';
import { Card, CardBody } from '../components/ui/Card';
import { Field } from '../components/ui/Field';
import { Input, Textarea } from '../components/ui/Input';
import { SkeletonText } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/States';
import { useI18n } from '../contexts/i18n';
import { cn } from '../lib/cn';
import { InlineAlert } from '../features/functions/InlineAlert';
import {
  HELP_MESSAGE_MAX,
  HELP_MESSAGE_MIN,
  LONG_NUMBER_PATTERN,
  conversationLink,
  helpStatusLabel,
  helpStatusTones,
} from '../features/help/helpOptions';
import { PrivateLinkBox } from '../features/help/PrivateLinkBox';
import { useHelpConversation, useHelpFollowUp } from '../features/help/queries';
import { SensitiveDataNotice } from '../features/help/SensitiveDataNotice';
import { usePublicOrganizations } from '../features/organizations/queries';
import type { HelpConversationView } from '../types/help';
import { errorMessage, fieldErrorsOf, statusOf } from '../utils/errors';
import { formatDateTime } from '../utils/format';
import { localizedText } from '../utils/translations';

const TOKEN = /^[A-Za-z0-9_-]{43}$/;

/** Accepts the full private link or just the token after "#". */
function tokenFrom(value: string): string | null {
  const candidate = value.trim().split('#').pop()?.trim() ?? '';
  return TOKEN.test(candidate) ? candidate : null;
}

function OpenByLink() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | undefined>();
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const token = tokenFrom(value);
    if (!token) {
      setError(t('help.linkInvalid', 'This does not look like a private conversation link. Copy the whole link.'));
      return;
    }
    navigate(`/help/conversation#${token}`, { replace: true });
  };
  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <Field label={t('help.pasteLink', 'Paste your private link')} error={error}>
        {(control) => <Input {...control} autoComplete="off" value={value} onChange={(event) => setValue(event.target.value)} />}
      </Field>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="dark">{t('help.openConversation', 'Open the conversation')}</Button>
        <Link to="/help" className={buttonVariants({ variant: 'outline' })}>{t('help.askNew', 'Ask a new question')}</Link>
      </div>
    </form>
  );
}

function statusExplanation(view: HelpConversationView, t: (key: string, fallback?: string) => string): string {
  switch (view.status) {
    case 'ANSWERED':
      return t('help.state.ANSWERED', 'The organization replied. You can write again if something is still unclear.');
    case 'CLOSED':
      return t('help.state.CLOSED', 'This conversation is closed. Ask a new question if you still need help.');
    default:
      return t('help.state.PENDING', 'Waiting for a reply. Staff answer questions in the order they arrive; this is not a live chat and no response time is guaranteed.');
  }
}

/** The visitor's conversation, opened through the private link (/help/conversation#token). No account is involved. */
export function HelpConversation() {
  const { t, locale } = useI18n();
  const location = useLocation();
  const token = tokenFrom(location.hash.replace(/^#/, ''));
  const conversation = useHelpConversation(token);
  const organizations = usePublicOrganizations();
  const honeypotId = useId();
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState('');
  const [error, setError] = useState<string | undefined>();
  const followUp = useHelpFollowUp(token ?? '');

  useEffect(() => {
    setMessage('');
    setError(undefined);
  }, [token]);

  const view = conversation.data;
  const organization = organizations.data?.find((item) => item.id === view?.organizationId);
  const organizationName = organization ? localizedText(organization.name, organization.nameTranslations, locale) : undefined;
  const staffName = view?.general ? t('help.supportTeam', 'Site support') : organizationName ?? t('help.organizationStaff', 'Organization staff');

  const send = async (event: FormEvent) => {
    event.preventDefault();
    const text = message.trim();
    if (text.length < HELP_MESSAGE_MIN) {
      setError(t('help.messageTooShort', 'Write your question in at least 10 characters'));
      return;
    }
    if (LONG_NUMBER_PATTERN.test(text)) {
      setError(t('help.messageHasNumber', 'Remove identification, card or document numbers: they are not needed to answer a question'));
      return;
    }
    setError(undefined);
    try {
      await followUp.mutateAsync({ message: text, website });
      setMessage('');
    } catch (failure) {
      setError(fieldErrorsOf(failure).message
        ?? (statusOf(failure) === 429 ? t('help.rateLimited', 'Too many questions were sent from your connection. Please try again later.') : errorMessage(failure, t)));
    }
  };

  return (
    <div className="shell py-10 sm:py-14 lg:py-16">
      <SectionHeading
        eyebrow={t('nav.help', 'Ask a question')}
        title={t('help.conversationTitle', 'Your question')}
        description={t('help.conversationSubtitle', 'Only people who have the private link can open this page. Nobody needs to sign in.')}
      />

      <div className="mt-8 max-w-3xl">
        {!token ? (
          <Card>
            <CardBody className="space-y-4 p-5 sm:p-7">
              <p className="text-base leading-7 text-secondary">
                {t('help.noToken', 'Open the private link you received after sending your question. If you copied it, paste it below.')}
              </p>
              <OpenByLink />
            </CardBody>
          </Card>
        ) : conversation.isPending ? (
          <Card><CardBody className="p-6"><SkeletonText lines={5} /></CardBody></Card>
        ) : conversation.error ? (
          statusOf(conversation.error) === 404 ? (
            <Card>
              <CardBody className="space-y-4 p-5 sm:p-7">
                <InlineAlert tone="warning">{t('help.notFound', 'No conversation belongs to this link. Check that you copied the whole link.')}</InlineAlert>
                <OpenByLink />
              </CardBody>
            </Card>
          ) : (
            <Card><ErrorState error={conversation.error} onRetry={() => void conversation.refetch()} /></Card>
          )
        ) : view ? (
          <div className="space-y-6">
            <Card>
              <CardBody className="space-y-4 p-5 sm:p-7">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="micro text-secondary">{view.general ? t('help.generalQuestionShort', 'General question') : t('help.service', 'Service')}</p>
                    {view.serviceId ? (
                      <Link to={`/functions/${view.serviceId}`} className="mt-1 block text-lg font-semibold text-foreground underline-offset-4 wrap-anywhere fine:hover:underline">
                        {view.serviceName ?? `#${view.serviceId}`}
                      </Link>
                    ) : (
                      <p className="mt-1 text-lg font-semibold text-foreground">{t('help.supportTeam', 'Site support')}</p>
                    )}
                  </div>
                  <StatusPill tone={helpStatusTones[view.status]}>{helpStatusLabel(view.status, t)}</StatusPill>
                </div>
                <p className="text-sm leading-6 text-secondary" role="status">{statusExplanation(view, t)}</p>
                <p className="flex items-start gap-2 text-sm leading-6 text-secondary">
                  {view.notificationRequested ? <BellIcon className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" /> : <BellOffIcon className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" />}
                  {view.notificationRequested
                    ? t('help.notifyYesShort', 'You will get an e-mail when a reply arrives.')
                    : t('help.notifyNo', 'You will not receive a notification. Open your private link later to check for a reply.')}
                </p>
                <Button variant="outline" size="sm" icon={<RefreshCwIcon />} loading={conversation.isFetching} onClick={() => void conversation.refetch()}>
                  {t('help.checkReply', 'Check for a reply')}
                </Button>
              </CardBody>
            </Card>

            <ol className="space-y-3" aria-label={t('help.messages', 'Messages')}>
              {view.messages.map((item, index) => (
                <li
                  key={index}
                  className={cn(
                    'rounded-card-sm border p-4',
                    item.author === 'STAFF' ? 'border-accent/40 bg-surface' : 'border-line bg-background sm:ms-10',
                  )}
                >
                  <p className="flex flex-wrap items-baseline justify-between gap-2 text-xs text-secondary">
                    <span className="font-semibold text-foreground">{item.author === 'STAFF' ? staffName : t('help.you', 'You')}</span>
                    <time dateTime={item.createdAt} className="tabular-nums">{formatDateTime(item.createdAt, locale)}</time>
                  </p>
                  <p className="mt-2 whitespace-pre-line text-base leading-7 text-foreground wrap-anywhere">{item.body}</p>
                </li>
              ))}
            </ol>

            {view.canWrite ? (
              <Card>
                <CardBody className="p-5 sm:p-7">
                  <form onSubmit={(event) => void send(event)} noValidate className="relative space-y-4">
                    <SensitiveDataNotice />
                    <Field label={t('help.writeAgain', 'Write again')} error={error}>
                      {(control) => (
                        <Textarea {...control} rows={4} maxLength={HELP_MESSAGE_MAX} value={message} onChange={(event) => setMessage(event.target.value)} />
                      )}
                    </Field>
                    <div aria-hidden="true" className="pointer-events-none absolute -start-[10000px] top-0 h-px w-px overflow-hidden">
                      <label htmlFor={honeypotId}>{t('report.honeypot', 'Leave this field empty')}</label>
                      <input id={honeypotId} name="website" type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} />
                    </div>
                    <Button type="submit" variant="dark" icon={<SendIcon />} loading={followUp.isPending}>{t('help.sendMessage', 'Send message')}</Button>
                  </form>
                </CardBody>
              </Card>
            ) : view.status !== 'CLOSED' ? (
              <InlineAlert tone="info">{t('help.waitForReply', 'Please wait for a reply before writing again.')}</InlineAlert>
            ) : (
              <Link to="/help" className={buttonVariants({ variant: 'dark' })}>{t('help.askNew', 'Ask a new question')}</Link>
            )}

            <Card>
              <CardBody className="p-5 sm:p-7">
                <PrivateLinkBox link={conversationLink(token)} />
              </CardBody>
            </Card>
          </div>
        ) : null}
      </div>
    </div>
  );
}
