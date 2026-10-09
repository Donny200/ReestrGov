import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon, ArrowRightIcon, CompassIcon, RotateCcwIcon } from 'lucide-react';
import { FunctionListRow } from '../components/catalog/FunctionListRow';
import { SectionHeading } from '../components/home/SectionHeading';
import { Button } from '../components/ui/Button';
import { buttonVariants } from '../components/ui/buttonVariants';
import { Card, CardBody } from '../components/ui/Card';
import { Field } from '../components/ui/Field';
import { Input } from '../components/ui/Input';
import { SkeletonList } from '../components/ui/Skeleton';
import { EmptyState, ErrorState, NoResultsState } from '../components/ui/States';
import { useI18n } from '../contexts/i18n';
import { useFunctionCategories, usePublicFunctions } from '../features/functions/queries';
import { usePublicOrganizations } from '../features/organizations/queries';
import { cn } from '../lib/cn';
import { matchesTerms, searchTerms, serviceHaystack } from '../utils/finder';
import { localizedText } from '../utils/translations';

type Step = 'situation' | 'goal' | 'organization' | 'results';

const STEPS: Step[] = ['situation', 'goal', 'organization', 'results'];
const GOAL_EXAMPLES = 5;

interface Choice {
  value: string;
  label: string;
  count: number;
}

function ChoiceList({ name, legend, hint, choices, value, onChange }: {
  name: string;
  legend: string;
  hint?: string;
  choices: Choice[];
  value: string;
  onChange: (value: string) => void;
}) {
  const { t } = useI18n();
  const hintId = useId();
  return (
    <fieldset aria-describedby={hint ? hintId : undefined}>
      <legend className="sr-only">{legend}</legend>
      {hint && <p id={hintId} className="mb-4 text-sm leading-6 text-secondary">{hint}</p>}
      <div className="grid gap-2 sm:grid-cols-2">
        {choices.map((choice) => {
          const id = `${name}-${choice.value || 'any'}`;
          const checked = value === choice.value;
          return (
            <label
              key={choice.value || 'any'}
              htmlFor={id}
              className={cn(
                'flex min-h-14 cursor-pointer items-center justify-between gap-3 rounded-card-sm border px-4 py-3 transition-colors duration-snap ease-snap has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent',
                checked ? 'border-ink bg-ink text-ink-fg' : 'border-line bg-background text-foreground fine:hover:bg-surface',
              )}
            >
              <span className="flex min-w-0 items-center gap-3">
                <input
                  id={id}
                  type="radio"
                  name={name}
                  value={choice.value}
                  checked={checked}
                  onChange={() => onChange(choice.value)}
                  className="h-4 w-4 shrink-0 accent-current"
                />
                <span className="min-w-0 font-medium wrap-anywhere">{choice.label}</span>
              </span>
              <span className={cn('shrink-0 text-xs tabular-nums', checked ? 'text-ink-secondary' : 'text-secondary')}>
                {choice.count} {t('finder.servicesShort', 'services')}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function ServiceFinder() {
  const { t, locale } = useI18n();
  const functions = usePublicFunctions();
  const categories = useFunctionCategories();
  const organizations = usePublicOrganizations();
  const [step, setStep] = useState<Step>('situation');
  const [categoryId, setCategoryId] = useState('');
  const [goal, setGoal] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  const goalHintId = useId();

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  const published = useMemo(() => functions.data ?? [], [functions.data]);
  const organizationName = useMemo(() => {
    const names = new Map<number, string>();
    (organizations.data ?? []).forEach((item) => names.set(item.id, localizedText(item.name, item.nameTranslations, locale) ?? item.name));
    return names;
  }, [organizations.data, locale]);
  const categoryName = useMemo(() => {
    const names = new Map<number, string>();
    (categories.data ?? []).forEach((item) => names.set(item.id, localizedText(item.name, item.nameTranslations, locale) ?? item.name));
    return names;
  }, [categories.data, locale]);

  const inCategory = useMemo(
    () => published.filter((item) => !categoryId || item.categoryId === Number(categoryId)),
    [published, categoryId],
  );
  const matchingGoal = useMemo(() => {
    const terms = searchTerms(goal, locale);
    if (terms.length === 0) return inCategory;
    return inCategory.filter((item) =>
      matchesTerms(
        serviceHaystack(item, locale, [
          item.categoryId != null ? categoryName.get(item.categoryId) : null,
          organizationName.get(item.organizationId),
        ]),
        terms,
      ),
    );
  }, [inCategory, goal, locale, categoryName, organizationName]);
  const results = useMemo(
    () => matchingGoal.filter((item) => !organizationId || item.organizationId === Number(organizationId)),
    [matchingGoal, organizationId],
  );

  const situationChoices = useMemo<Choice[]>(() => {
    const counts = new Map<number, number>();
    published.forEach((item) => {
      if (item.categoryId != null) counts.set(item.categoryId, (counts.get(item.categoryId) ?? 0) + 1);
    });
    const known = [...counts.entries()]
      .map(([id, count]) => ({ value: String(id), label: categoryName.get(id) ?? published.find((item) => item.categoryId === id)?.category ?? `#${id}`, count }))
      .sort((a, b) => a.label.localeCompare(b.label, locale));
    return [{ value: '', label: t('finder.anySituation', 'I am not sure / show all areas'), count: published.length }, ...known];
  }, [published, categoryName, locale, t]);

  const organizationChoices = useMemo<Choice[]>(() => {
    const counts = new Map<number, number>();
    matchingGoal.forEach((item) => counts.set(item.organizationId, (counts.get(item.organizationId) ?? 0) + 1));
    const known = [...counts.entries()]
      .map(([id, count]) => ({ value: String(id), label: organizationName.get(id) ?? `#${id}`, count }))
      .sort((a, b) => a.label.localeCompare(b.label, locale));
    return [{ value: '', label: t('finder.anyOrganization', 'Any organization'), count: matchingGoal.length }, ...known];
  }, [matchingGoal, organizationName, locale, t]);

  useEffect(() => {
    if (organizationId && !organizationChoices.some((choice) => choice.value === organizationId)) setOrganizationId('');
  }, [organizationChoices, organizationId]);

  const examples = useMemo(
    () => inCategory.slice(0, GOAL_EXAMPLES).map((item) => localizedText(item.name, item.nameTranslations, locale) ?? item.name),
    [inCategory, locale],
  );

  const index = STEPS.indexOf(step);
  const go = (next: Step) => setStep(next);
  const next = () => go(STEPS[Math.min(index + 1, STEPS.length - 1)]);
  const back = () => go(STEPS[Math.max(index - 1, 0)]);
  const restart = () => {
    setCategoryId('');
    setGoal('');
    setOrganizationId('');
    go('situation');
  };
  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    next();
  };

  const stepTitles: Record<Step, string> = {
    situation: t('finder.situationQuestion', 'What is your situation?'),
    goal: t('finder.goalQuestion', 'What do you want to do?'),
    organization: t('finder.organizationQuestion', 'Do you already know the organization?'),
    results: t('finder.resultsTitle', 'Services that match your answers'),
  };
  const stepLabels: Record<Step, string> = {
    situation: t('finder.stepSituation', 'Situation'),
    goal: t('finder.stepGoal', 'Goal'),
    organization: t('finder.stepOrganization', 'Organization'),
    results: t('finder.stepResults', 'Results'),
  };
  const loading = functions.isPending || categories.isPending || organizations.isPending;
  const loadError = functions.error ?? categories.error ?? organizations.error;
  const matchCounts: Record<Step, number> = {
    situation: inCategory.length,
    goal: matchingGoal.length,
    organization: results.length,
    results: results.length,
  };

  return (
    <div className="shell py-10 sm:py-14 lg:py-16">
      <SectionHeading
        eyebrow={t('finder.eyebrow', 'Service finder')}
        title={t('finder.title', 'Find the right service step by step')}
        description={t('finder.subtitle', 'Answer up to three short questions. Nothing you enter is sent or stored, and you do not need an account.')}
      />

      <Card className="mt-8">
        {loading ? (
          <CardBody><SkeletonList count={3} /></CardBody>
        ) : loadError ? (
          <ErrorState
            error={loadError}
            onRetry={() => {
              void functions.refetch();
              void categories.refetch();
              void organizations.refetch();
            }}
          />
        ) : published.length === 0 ? (
          <EmptyState
            icon={<CompassIcon className="h-6 w-6" aria-hidden="true" />}
            title={t('finder.emptyCatalogTitle', 'No services are published yet')}
            description={t('finder.emptyCatalogText', 'Please check again later or browse the organizations.')}
            action={<Link to="/#organizations" className={buttonVariants({ variant: 'outline', size: 'sm' })}>{t('nav.organizations')}</Link>}
          />
        ) : (
          <CardBody className="space-y-6 sm:p-8">
            <ol aria-label={t('finder.progress', 'Progress')} className="flex flex-wrap gap-2">
              {STEPS.map((item, position) => (
                <li
                  key={item}
                  aria-current={item === step ? 'step' : undefined}
                  className={cn(
                    'inline-flex min-h-9 items-center gap-2 rounded-pill px-3.5 text-sm font-medium',
                    item === step ? 'bg-ink text-ink-fg' : position < index ? 'bg-surface text-foreground' : 'bg-surface text-secondary',
                  )}
                >
                  <span className="tabular-nums" aria-hidden="true">{position + 1}</span>
                  {stepLabels[item]}
                </li>
              ))}
            </ol>

            <div>
              <h2 ref={headingRef} tabIndex={-1} className="text-2xl font-semibold text-foreground focus:outline-none sm:text-3xl">
                {stepTitles[step]}
              </h2>
              <p className="mt-2 text-sm tabular-nums text-secondary" aria-live="polite">
                {matchCounts[step]} {t('finder.matching', 'services match your answers so far')}
              </p>
            </div>

            {step === 'results' ? (
              results.length === 0 ? (
                <div className="space-y-4">
                  <NoResultsState
                    title={t('finder.noResultsTitle', 'No published services match these answers')}
                    description={t('finder.noResultsText', 'Try fewer keywords, another situation or any organization.')}
                  />
                  <div className="flex flex-wrap justify-center gap-2">
                    {goal && <Button variant="outline" size="sm" onClick={() => setGoal('')}>{t('finder.clearGoal', 'Clear keywords')}</Button>}
                    {organizationId && <Button variant="outline" size="sm" onClick={() => setOrganizationId('')}>{t('finder.anyOrganization', 'Any organization')}</Button>}
                    {categoryId && <Button variant="outline" size="sm" onClick={() => go('situation')}>{t('finder.otherSituation', 'Choose another situation')}</Button>}
                    <Link to="/#functions" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>{t('finder.browseAll', 'Browse the full catalogue')}</Link>
                  </div>
                </div>
              ) : (
                <ol className="border-b border-line">
                  {results.map((item, position) => (
                    <FunctionListRow key={item.id} item={item} index={position + 1} organizationName={organizationName.get(item.organizationId)} />
                  ))}
                </ol>
              )
            ) : (
              <form onSubmit={onSubmit} className="space-y-6" noValidate>
                {step === 'situation' && (
                  <ChoiceList
                    name="finder-situation"
                    legend={stepTitles.situation}
                    hint={t('finder.situationHint', 'Choose the area of life your question belongs to.')}
                    choices={situationChoices}
                    value={categoryId}
                    onChange={setCategoryId}
                  />
                )}
                {step === 'goal' && (
                  <div className="space-y-4">
                    <Field
                      label={t('finder.goalLabel', 'Describe your goal in a few words (optional)')}
                      hint={t('finder.goalHint', 'For example: certificate, registration, duplicate. Leave it empty to see every service in this area.')}
                    >
                      {(control) => (
                        <Input {...control} type="search" value={goal} autoComplete="off" maxLength={120} onChange={(event) => setGoal(event.target.value)} />
                      )}
                    </Field>
                    {examples.length > 0 && (
                      <div>
                        <p id={goalHintId} className="micro mb-2 text-secondary">{t('finder.examples', 'Services in this area')}</p>
                        <ul className="flex flex-wrap gap-2" aria-labelledby={goalHintId}>
                          {examples.map((example) => (
                            <li key={example}>
                              <Button variant="light" size="sm" onClick={() => setGoal(example)}>{example}</Button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                {step === 'organization' && (
                  <ChoiceList
                    name="finder-organization"
                    legend={stepTitles.organization}
                    hint={t('finder.organizationHint', 'Only organizations with matching services are listed.')}
                    choices={organizationChoices}
                    value={organizationId}
                    onChange={setOrganizationId}
                  />
                )}
                <div className="flex flex-col-reverse gap-2 border-t border-line pt-5 sm:flex-row sm:justify-between">
                  {index > 0 ? <Button variant="ghost" icon={<ArrowLeftIcon />} onClick={back}>{t('action.back', 'Back')}</Button> : <span aria-hidden="true" />}
                  <Button type="submit" variant="dark" icon={<ArrowRightIcon />}>
                    {step === 'organization' ? t('finder.showResults', 'Show services') : t('finder.next', 'Next')}
                  </Button>
                </div>
              </form>
            )}

            {step === 'results' && (
              <div className="flex flex-wrap gap-2 border-t border-line pt-5">
                <Button variant="ghost" icon={<ArrowLeftIcon />} onClick={back}>{t('action.back', 'Back')}</Button>
                <Button variant="outline" icon={<RotateCcwIcon />} onClick={restart}>{t('finder.restart', 'Start over')}</Button>
              </div>
            )}
          </CardBody>
        )}
      </Card>
    </div>
  );
}
