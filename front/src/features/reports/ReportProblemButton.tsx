import { useId, useState, type FormEvent } from 'react';
import { CheckCircle2Icon, FlagIcon } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Field } from '../../components/ui/Field';
import { Input, Textarea } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { useI18n } from '../../contexts/i18n';
import { cn } from '../../lib/cn';
import { errorMessage, fieldErrorsOf, statusOf, type Translate } from '../../utils/errors';
import { InlineAlert } from '../functions/InlineAlert';
import type { ReportCategory, ReportEntityType } from '../../types/reports';
import { useSubmitReport } from './queries';
import {
  REPORT_CATEGORIES,
  REPORT_CONTACT_MAX,
  REPORT_CONTACT_PATTERN,
  REPORT_DESCRIPTION_MAX,
  REPORT_DESCRIPTION_MIN,
  reportCategoryLabels,
} from './reportOptions';

const FORM_ID = 'report-problem-form';

interface ReportProblemButtonProps {
  entityType: ReportEntityType;
  entityId: number;
  entityName: string;
  className?: string;
}

interface FormState {
  category: ReportCategory | '';
  description: string;
  contact: string;
  website: string;
}

const emptyForm: FormState = { category: '', description: '', contact: '', website: '' };

function failureText(failure: unknown, t: Translate): string | null {
  if (!failure || Object.keys(fieldErrorsOf(failure)).length > 0) return null;
  if (statusOf(failure) === 429) return t('report.rateLimited', 'Too many reports were sent from your connection. Please try again later.');
  if (statusOf(failure) === 404) return t('report.notAvailable', 'This page is no longer published, so it cannot be reported.');
  return errorMessage(failure, t);
}

export function ReportProblemButton({ entityType, entityId, entityName, className }: ReportProblemButtonProps) {
  const { t, locale } = useI18n();
  const submit = useSubmitReport();
  const honeypotId = useId();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [sent, setSent] = useState(false);

  const close = () => {
    if (submit.isPending) return;
    setOpen(false);
  };

  const start = () => {
    setForm(emptyForm);
    setErrors({});
    setSent(false);
    submit.reset();
    setOpen(true);
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.category) next.category = t('validation.required', 'This field is required');
    const description = form.description.trim();
    if (description.length < REPORT_DESCRIPTION_MIN) {
      next.description = t('report.descriptionTooShort', 'Describe the problem in at least 10 characters');
    }
    const contact = form.contact.trim();
    if (contact && !REPORT_CONTACT_PATTERN.test(contact)) {
      next.contact = t('report.contactInvalid', 'Enter an email address or a phone number, or leave the field empty');
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submit.isPending || !validate() || !form.category) return;
    try {
      await submit.mutateAsync({
        entityType,
        entityId,
        category: form.category,
        description: form.description.trim(),
        contact: form.contact.trim(),
        language: locale,
        website: form.website,
      });
      setSent(true);
    } catch (error) {
      const fields = fieldErrorsOf(error);
      setErrors({ description: fields.description, contact: fields.contact, category: fields.category });
    }
  };

  const failureMessage = failureText(submit.error, t);

  return (
    <>
      <Button variant="ghost" size="sm" icon={<FlagIcon />} onClick={start} className={cn('print:hidden', className)}>
        {t('report.open', 'Report a problem')}
      </Button>
      <Modal
        open={open}
        onClose={close}
        closeDisabled={submit.isPending}
        icon={<FlagIcon aria-hidden="true" />}
        title={t('report.title', 'Report incorrect or outdated information')}
        description={entityName}
        footer={
          sent ? (
            <Button variant="dark" onClick={close}>{t('action.close', 'Close')}</Button>
          ) : (
            <>
              <Button variant="outline" onClick={close} disabled={submit.isPending}>{t('action.cancel', 'Cancel')}</Button>
              <Button type="submit" form={FORM_ID} variant="dark" loading={submit.isPending}>{t('report.send', 'Send report')}</Button>
            </>
          )
        }
      >
        {sent ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center" role="status">
            <span className="flex h-12 w-12 items-center justify-center rounded-pill bg-status-published-bg text-status-published">
              <CheckCircle2Icon className="h-6 w-6" aria-hidden="true" />
            </span>
            <p className="text-lg font-semibold text-foreground">{t('report.thanksTitle', 'Thank you, your report was sent')}</p>
            <p className="max-w-sm text-sm leading-6 text-secondary">
              {t('report.thanksText', 'Editors will check it against official sources. Public information changes only after their review.')}
            </p>
          </div>
        ) : (
          <form id={FORM_ID} onSubmit={(event) => void onSubmit(event)} noValidate className="relative space-y-5">
            <p className="text-sm leading-6 text-secondary">
              {t('report.intro', 'Tell us what is wrong on this page. You do not need an account.')}
            </p>
            <Field label={t('report.category', 'What is wrong?')} required error={errors.category}>
              {(control) => (
                <Select
                  {...control}
                  value={form.category}
                  onValueChange={(value) => setForm({ ...form, category: value as ReportCategory })}
                  placeholder={t('fnAdmin.choose', 'Choose')}
                  options={REPORT_CATEGORIES[entityType].map((category) => ({
                    value: category,
                    label: t(`report.category.${category}`, reportCategoryLabels[category]),
                  }))}
                />
              )}
            </Field>
            <Field
              label={t('report.description', 'Describe the problem')}
              required
              error={errors.description}
              hint={t('report.descriptionHint', 'Say what is wrong and, if you know it, where the correct information is published.')}
            >
              {(control) => (
                <Textarea
                  {...control}
                  rows={5}
                  maxLength={REPORT_DESCRIPTION_MAX}
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                />
              )}
            </Field>
            <Field
              label={t('report.contact', 'Email or phone for questions')}
              error={errors.contact}
              hint={t('report.contactHint', 'Optional. Only staff handling the report can see it, and it is deleted when the report is closed.')}
            >
              {(control) => (
                <Input
                  {...control}
                  maxLength={REPORT_CONTACT_MAX}
                  autoComplete="off"
                  value={form.contact}
                  onChange={(event) => setForm({ ...form, contact: event.target.value })}
                />
              )}
            </Field>
            <div aria-hidden="true" className="pointer-events-none absolute -start-[10000px] top-0 h-px w-px overflow-hidden">
              <label htmlFor={honeypotId}>{t('report.honeypot', 'Leave this field empty')}</label>
              <input
                id={honeypotId}
                name="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={form.website}
                onChange={(event) => setForm({ ...form, website: event.target.value })}
              />
            </div>
            <InlineAlert tone="info">
              {t('report.privacy', 'Do not include personal documents or ID numbers. Reports are private and never change the page automatically.')}
            </InlineAlert>
            {failureMessage && <InlineAlert tone="danger">{failureMessage}</InlineAlert>}
          </form>
        )}
      </Modal>
    </>
  );
}
