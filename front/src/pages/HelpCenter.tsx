import { useId, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2Icon, MessageCircleQuestionIcon, SendIcon } from 'lucide-react';
import { SectionHeading } from '../components/home/SectionHeading';
import { Button } from '../components/ui/Button';
import { buttonVariants } from '../components/ui/buttonVariants';
import { Card, CardBody } from '../components/ui/Card';
import { Field } from '../components/ui/Field';
import { Input, Textarea } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { useI18n } from '../contexts/i18n';
import { InlineAlert } from '../features/functions/InlineAlert';
import { usePublicFunctions } from '../features/functions/queries';
import {
  HELP_EMAIL_PATTERN,
  HELP_MESSAGE_MAX,
  HELP_MESSAGE_MIN,
  LONG_NUMBER_PATTERN,
  conversationLink,
} from '../features/help/helpOptions';
import { PrivateLinkBox } from '../features/help/PrivateLinkBox';
import { useHelpOptions, useStartHelpConversation } from '../features/help/queries';
import { SensitiveDataNotice } from '../features/help/SensitiveDataNotice';
import { ServiceAnswerPreview } from '../features/help/ServiceAnswerPreview';
import { usePublicOrganizations } from '../features/organizations/queries';
import { parseId } from '../features/analytics/scope';
import { errorMessage, fieldErrorsOf, statusOf, type Translate } from '../utils/errors';
import { localizedText } from '../utils/translations';

interface FormState {
  serviceId: string;
  message: string;
  email: string;
  website: string;
}

function failureText(failure: unknown, t: Translate): string | null {
  if (!failure || Object.keys(fieldErrorsOf(failure)).length > 0) return null;
  if (statusOf(failure) === 429) return t('help.rateLimited', 'Too many questions were sent from your connection. Please try again later.');
  if (statusOf(failure) === 404) return t('help.serviceUnavailable', 'This service is no longer published. Choose another service or ask a general question.');
  return errorMessage(failure, t);
}

/**
 * Public help entry point: ask the organization responsible for a service (or general support) a question without an
 * account. This is not a live chat and not an application for the service; replies arrive when staff answer.
 */
export function HelpCenter() {
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const options = useHelpOptions();
  const functions = usePublicFunctions();
  const organizations = usePublicOrganizations();
  const start = useStartHelpConversation();
  const honeypotId = useId();
  const initialService = parseId(params.get('service'));
  const [form, setForm] = useState<FormState>({ serviceId: initialService ? String(initialService) : '', message: '', email: '', website: '' });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [created, setCreated] = useState<{ link: string; token: string; notification: boolean } | null>(null);

  const notificationsAvailable = options.data?.notificationsAvailable ?? false;
  const services = useMemo(
    () =>
      (functions.data ?? [])
        .map((item) => ({ item, name: localizedText(item.name, item.nameTranslations, locale) ?? item.name }))
        .sort((a, b) => a.name.localeCompare(b.name, locale)),
    [functions.data, locale],
  );
  const selected = services.find(({ item }) => String(item.id) === form.serviceId)?.item;
  const organization = organizations.data?.find((item) => item.id === selected?.organizationId);
  const unknownService = Boolean(form.serviceId) && functions.isSuccess && !selected;

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};
    const message = form.message.trim();
    if (message.length < HELP_MESSAGE_MIN) next.message = t('help.messageTooShort', 'Write your question in at least 10 characters');
    else if (LONG_NUMBER_PATTERN.test(message)) {
      next.message = t('help.messageHasNumber', 'Remove identification, card or document numbers: they are not needed to answer a question');
    }
    const email = form.email.trim();
    if (email && !HELP_EMAIL_PATTERN.test(email)) next.email = t('help.emailInvalid', 'Enter a valid e-mail address or leave the field empty');
    if (unknownService) next.serviceId = t('help.serviceUnavailable', 'This service is no longer published. Choose another service or ask a general question.');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (start.isPending || !validate()) return;
    try {
      const result = await start.mutateAsync({
        serviceId: selected?.id,
        message: form.message.trim(),
        email: notificationsAvailable ? form.email.trim() : undefined,
        language: locale,
        website: form.website,
      });
      setCreated({ link: conversationLink(result.accessToken), token: result.accessToken, notification: result.conversation.notificationRequested });
      window.scrollTo({ top: 0 });
    } catch (error) {
      const fields = fieldErrorsOf(error);
      setErrors({ message: fields.message, email: fields.email, serviceId: fields.serviceId });
    }
  };

  const failure = failureText(start.error, t);

  if (created) {
    return (
      <div className="shell py-10 sm:py-14 lg:py-16">
        <Card size="lg" className="mx-auto max-w-3xl">
          <CardBody className="space-y-6 p-6 sm:p-10">
            <div className="flex items-start gap-4" role="status">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-pill bg-status-published-bg text-status-published">
                <CheckCircle2Icon className="h-6 w-6" aria-hidden="true" />
              </span>
              <div>
                <h1 className="text-2xl font-semibold text-foreground">{t('help.sentTitle', 'Your question was sent')}</h1>
                <p className="mt-2 text-base leading-7 text-secondary">
                  {t('help.sentText', 'Staff of the organization will read it and reply here. This is not a live chat: replies may take some time, and no response time is guaranteed.')}
                </p>
              </div>
            </div>
            <PrivateLinkBox link={created.link} />
            <InlineAlert tone="info">
              {created.notification
                ? t('help.notifyYes', 'We will send an e-mail to the address you gave when a reply arrives. The e-mail is used only for this and deleted when the conversation is closed.')
                : t('help.notifyNo', 'You will not receive a notification. Open your private link later to check for a reply.')}
            </InlineAlert>
            <div className="flex flex-wrap gap-2">
              <Button variant="dark" onClick={() => navigate(`/help/conversation#${created.token}`)}>{t('help.openConversation', 'Open the conversation')}</Button>
              {selected && (
                <Link to={`/functions/${selected.id}`} className={buttonVariants({ variant: 'outline' })}>{t('help.backToService', 'Back to the service')}</Link>
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="shell py-10 sm:py-14 lg:py-16">
      <SectionHeading
        eyebrow={t('nav.help', 'Ask a question')}
        title={t('help.title', 'Ask a question about a service')}
        description={t('help.subtitle', 'Ask the organization responsible for a service about its requirements, documents or steps. You do not need an account. This is not an application for the service.')}
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(18rem,0.9fr)] lg:items-start">
        <Card>
          <CardBody className="p-5 sm:p-7">
            <form onSubmit={(event) => void onSubmit(event)} noValidate className="relative space-y-5" aria-labelledby="help-form-title">
              <h2 id="help-form-title" className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <MessageCircleQuestionIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
                {t('help.formTitle', 'Your question')}
              </h2>
              <Field
                label={t('help.service', 'Service')}
                error={errors.serviceId}
                hint={t('help.serviceHint', 'Choose a service to send the question to its organization, or leave “General question” for the site support team.')}
              >
                {(control) => (
                  <Select
                    {...control}
                    value={form.serviceId}
                    onValueChange={(value) => setForm({ ...form, serviceId: value })}
                    options={[
                      { value: '', label: t('help.generalQuestion', 'General question (no specific service)') },
                      ...services.map(({ item, name }) => ({ value: String(item.id), label: name })),
                      ...(unknownService ? [{ value: form.serviceId, label: `#${form.serviceId}` }] : []),
                    ]}
                  />
                )}
              </Field>

              {selected && <ServiceAnswerPreview service={selected} organization={organization} />}

              <SensitiveDataNotice />

              <Field label={t('help.message', 'Your question')} required error={errors.message} hint={t('help.messageHint', 'Describe what you want to know. Up to 2000 characters.')}>
                {(control) => (
                  <Textarea
                    {...control}
                    rows={6}
                    maxLength={HELP_MESSAGE_MAX}
                    value={form.message}
                    onChange={(event) => setForm({ ...form, message: event.target.value })}
                  />
                )}
              </Field>

              {notificationsAvailable && (
                <Field
                  label={t('help.email', 'E-mail for a reply notification')}
                  error={errors.email}
                  hint={t('help.emailHint', 'Optional. Used only to tell you that a reply arrived and deleted when the conversation is closed. Staff do not see it.')}
                >
                  {(control) => (
                    <Input
                      {...control}
                      type="email"
                      maxLength={254}
                      autoComplete="email"
                      value={form.email}
                      onChange={(event) => setForm({ ...form, email: event.target.value })}
                    />
                  )}
                </Field>
              )}

              <div aria-hidden="true" className="pointer-events-none absolute -start-[10000px] top-0 h-px w-px overflow-hidden">
                <label htmlFor={honeypotId}>{t('report.honeypot', 'Leave this field empty')}</label>
                <input id={honeypotId} name="website" type="text" tabIndex={-1} autoComplete="off" value={form.website}
                  onChange={(event) => setForm({ ...form, website: event.target.value })} />
              </div>

              {failure && <InlineAlert tone="danger">{failure}</InlineAlert>}

              <Button type="submit" variant="dark" icon={<SendIcon />} loading={start.isPending}>{t('help.send', 'Send question')}</Button>
            </form>
          </CardBody>
        </Card>

        <aside className="space-y-4" aria-label={t('help.howItWorks', 'How it works')}>
          <Card>
            <CardBody className="space-y-3 p-5 text-sm leading-6 text-secondary">
              <h2 className="text-base font-semibold text-foreground">{t('help.howItWorks', 'How it works')}</h2>
              <ol className="list-decimal space-y-2 ps-5">
                <li>{t('help.step1', 'Send your question. You do not need an account.')}</li>
                <li>{t('help.step2', 'You get a private link. Save it: it is the only way to read the reply and to write again.')}</li>
                <li>
                  {notificationsAvailable
                    ? t('help.step3Notify', 'If you leave an e-mail address, we tell you when a reply arrives.')
                    : t('help.step3NoNotify', 'This site does not send notifications. Open your private link later to check for a reply.')}
                </li>
                <li>{t('help.step4', 'Staff answer questions in the order they arrive. This is not a live chat, and no response time is guaranteed.')}</li>
              </ol>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="space-y-2 p-5 text-sm leading-6 text-secondary">
              <h2 className="text-base font-semibold text-foreground">{t('help.reportInsteadTitle', 'Found a mistake on a service page?')}</h2>
              <p>{t('help.reportInsteadText', 'Use “Report a problem” on that page instead. Reports of incorrect information are handled separately from questions.')}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="space-y-2 p-5 text-sm leading-6 text-secondary">
              <h2 className="text-base font-semibold text-foreground">{t('help.returnTitle', 'Already asked a question?')}</h2>
              <p>{t('help.returnText', 'Open the private link you saved, or paste it on the conversation page.')}</p>
              <Link to="/help/conversation" className={buttonVariants({ variant: 'outline', size: 'sm' })}>{t('help.openSaved', 'Open my conversation')}</Link>
            </CardBody>
          </Card>
        </aside>
      </div>
    </div>
  );
}
