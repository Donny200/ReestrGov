import { useId, type ReactNode } from 'react';
import { InfoIcon } from 'lucide-react';
import { Checkbox } from '../ui/Input';
import { useI18n } from '../../contexts/i18n';
import { cn } from '../../lib/cn';
import type { CatalogFunction, InstructionField } from '../../types/api';
import { instructionItems, localizedInstruction, type LocalizedInstruction } from '../../utils/instructions';
import { requirementLines } from '../../utils/format';

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

function StepList({ items }: { items: string[] }) {
  return (
    <ol className="space-y-4">
      {items.map((item, index) => (
        <li key={index} className="flex items-start gap-4 break-inside-avoid">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-pill bg-ink text-sm font-semibold tabular-nums text-ink-fg print:border print:border-line print:bg-transparent print:text-foreground" aria-hidden="true">
            {index + 1}
          </span>
          <span className="min-w-0 pt-0.5 text-base leading-7 text-foreground wrap-anywhere">{item}</span>
        </li>
      ))}
    </ol>
  );
}

function DocumentChecklist({ items, label }: { items: string[]; label: string }) {
  const prefix = useId();
  return (
    <ul className="space-y-2" aria-label={label}>
      {items.map((item, index) => (
        <li key={index} className="break-inside-avoid">
          <label htmlFor={`${prefix}-${index}`} className="flex cursor-pointer items-start gap-3 rounded-control px-1 py-1.5 text-base leading-7 text-foreground fine:hover:bg-surface">
            <Checkbox id={`${prefix}-${index}`} className="mt-1" />
            <span className="min-w-0 wrap-anywhere">{item}</span>
          </label>
        </li>
      ))}
    </ul>
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

      <Section id={`${baseId}-steps`} title={t('instructions.steps', 'Step-by-step procedure')} language={locale}>
        {steps ? <StepList items={instructionItems(steps.text)} /> : <NotProvided t={t} />}
      </Section>

      {documents ? (
        <Section id={`${baseId}-documents`} title={documentsLabel} language={locale}>
          <DocumentChecklist items={instructionItems(documents.text)} label={documentsLabel} />
        </Section>
      ) : requirements.length > 0 ? (
        <Section id={`${baseId}-documents`} title={requirementsLabel}>
          <DocumentChecklist items={requirements} label={requirementsLabel} />
        </Section>
      ) : (
        <Section id={`${baseId}-documents`} title={documentsLabel}>
          <NotProvided t={t} />
        </Section>
      )}

      {documents && requirements.length > 0 && (
        <Section id={`${baseId}-requirements`} title={t('instructions.additionalRequirements', 'Additional requirements')}>
          <ul className="list-disc space-y-2 ps-5 text-base leading-7 text-foreground">
            {requirements.map((line, index) => <li key={index} className="wrap-anywhere">{line}</li>)}
          </ul>
        </Section>
      )}

      <Section id={`${baseId}-where`} title={t('instructions.whereHowToApply', 'Where and how to apply')} language={locale}>
        {whereHow ? <p className="whitespace-pre-line text-base leading-7 text-foreground wrap-anywhere">{whereHow.text}</p> : <NotProvided t={t} />}
      </Section>
    </>
  );
}
