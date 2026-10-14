import { useId, type ReactNode } from 'react';
import { InfoIcon } from 'lucide-react';
import { useI18n } from '../../contexts/i18n';
import { cn } from '../../lib/cn';
import type { CatalogFunction, InstructionField } from '../../types/api';
import { localizedInstruction, type LocalizedInstruction } from '../../utils/instructions';
import { requirementLines } from '../../utils/format';
import { ChecklistItems, ChecklistSummary } from '../../features/checklist/PreparationChecklist';

type Translate = (key: string, fallback?: string) => string;

function NotProvided({ t }: { t: Translate }) {
  return (
    <p className="flex items-start gap-2.5 text-base leading-7 text-secondary">
      <InfoIcon className="mt-1 h-4 w-4 shrink-0 print:hidden" aria-hidden="true" />
      {t('instructions.notProvided', 'Not provided yet. Confirm with the organization before you apply.')}
    </p>
  );
}

function Section({ id, title, children, language }: { id: string; title: string; children: ReactNode; language?: string }) {
  return (
    <section className="mt-10 border-t border-line pt-8 break-inside-avoid-page print:mt-6 print:pt-4" aria-labelledby={id}>
      <h2 id={id} className="micro text-secondary">{title}</h2>
      <div className="mt-4" lang={language}>{children}</div>
    </section>
  );
}

function Fact({ label, value, t }: { label: string; value: LocalizedInstruction | null; t: Translate }) {
  return (
    <div className="rounded-card-sm border border-line p-4 break-inside-avoid">
      <dt className="micro text-secondary">{label}</dt>
      <dd className={cn('mt-2 whitespace-pre-line text-base leading-7 wrap-anywhere', value ? 'text-foreground' : 'text-secondary')}>
        {value?.text ?? t('instructions.notSpecified', 'Not specified')}
      </dd>
    </div>
  );
}

interface ServiceInstructionsViewProps {
  record: CatalogFunction;
}

/** Documents, requirements and steps are rendered as the visitor's browser-local preparation checklist. */
export function ServiceInstructionsView({ record }: ServiceInstructionsViewProps) {
  const { t, locale } = useI18n();
  const baseId = useId();
  const value = (field: InstructionField) => localizedInstruction(record, field, locale);
  const steps = value('steps');
  const documents = value('requiredDocuments');
  const whereHow = value('whereHowToApply');
  const requirements = requirementLines(record.requirements);
  const documentsLabel = t('instructions.requiredDocuments', 'Required documents');
  const requirementsLabel = t('field.requirements', 'Requirements');

  return (
    <>
      <section className="mt-10 border-t border-line pt-8 print:mt-6 print:pt-4" aria-labelledby={`${baseId}-facts`}>
        <h2 id={`${baseId}-facts`} className="micro text-secondary">{t('instructions.atAGlance', 'At a glance')}</h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-3 print:grid-cols-3" lang={locale}>
          <Fact label={t('instructions.whoCanUse', 'Who can use this service')} value={value('whoCanUse')} t={t} />
          <Fact label={t('instructions.processingTime', 'Processing time')} value={value('processingTime')} t={t} />
          <Fact label={t('instructions.fee', 'Official fee')} value={value('fee')} t={t} />
        </dl>
      </section>

      <ChecklistSummary record={record} />

      <Section id={`${baseId}-steps`} title={t('instructions.steps', 'Step-by-step procedure')} language={locale}>
        {steps ? <ChecklistItems record={record} section="steps" label={t('instructions.steps', 'Step-by-step procedure')} numbered /> : <NotProvided t={t} />}
      </Section>

      {documents ? (
        <Section id={`${baseId}-documents`} title={documentsLabel} language={locale}>
          <ChecklistItems record={record} section="documents" label={documentsLabel} />
        </Section>
      ) : requirements.length > 0 ? (
        <Section id={`${baseId}-documents`} title={requirementsLabel}>
          <ChecklistItems record={record} section="requirements" label={requirementsLabel} />
        </Section>
      ) : (
        <Section id={`${baseId}-documents`} title={documentsLabel}>
          <NotProvided t={t} />
        </Section>
      )}

      {documents && requirements.length > 0 && (
        <Section id={`${baseId}-requirements`} title={t('instructions.additionalRequirements', 'Additional requirements')}>
          <ChecklistItems record={record} section="requirements" label={t('instructions.additionalRequirements', 'Additional requirements')} />
        </Section>
      )}

      <Section id={`${baseId}-where`} title={t('instructions.whereHowToApply', 'Where and how to apply')} language={locale}>
        {whereHow ? <p className="whitespace-pre-line text-base leading-7 text-foreground wrap-anywhere">{whereHow.text}</p> : <NotProvided t={t} />}
      </Section>
    </>
  );
}
