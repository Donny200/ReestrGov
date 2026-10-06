import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { RefreshCwIcon, SparklesIcon } from 'lucide-react';
import { useI18n } from '../../contexts/i18n';
import { useAutoTranslateFunction, useTranslationCapabilities } from '../../features/functions/queries';
import { FunctionErrorState } from '../../features/functions/FunctionErrorState';
import { InlineAlert } from '../../features/functions/InlineAlert';
import { hasFunctionTranslation } from '../../utils/functionLocalization';
import { errorMessage } from '../../utils/errors';
import { Button } from '../ui/Button';
import { SkeletonText } from '../ui/Skeleton';
import type { AdminFunction } from '../../types/adminFunctions';

interface Props {
  record: AdminFunction;
  language: string;
  blocked: boolean;
  busy: boolean;
}

interface Attempt {
  languages: string[];
  overwriteMachine: boolean;
}

export function FunctionAutoTranslate({ record, language, blocked, busy }: Props) {
  const { t, available } = useI18n();
  const location = useLocation();
  const capabilities = useTranslationCapabilities();
  const translate = useAutoTranslateFunction(record.id);
  const [error, setError] = useState<unknown>(null);
  const attemptedOnCreate = useRef(false);
  const lastAttempt = useRef<Attempt | null>(null);
  const { mutateAsync } = translate;

  const canTranslate = capabilities.data?.available === true;
  const isDraft = record.status === 'DRAFT';
  const missing = available.map((item) => item.code).filter((code) => !hasFunctionTranslation(record, code));
  const machine =
    record.nameTranslations?.[language]?.source === 'machine' || record.descriptionTranslations?.[language]?.source === 'machine';

  const generate = useCallback(
    async (languages: string[], overwriteMachine = false) => {
      if (busy || blocked || !canTranslate || !isDraft || languages.length === 0) return;
      lastAttempt.current = { languages, overwriteMachine };
      setError(null);
      try {
        await mutateAsync({ languages, overwriteMachine });
        toast.success(t('fnAdmin.translationSuccess'));
      } catch (failure) {
        setError(failure);
      }
    },
    [busy, blocked, canTranslate, isDraft, mutateAsync, t],
  );

  const createdFlag = Boolean((location.state as { created?: boolean } | null)?.created);
  const missingKey = missing.join(',');
  useEffect(() => {
    if (attemptedOnCreate.current || !createdFlag || !canTranslate || busy || blocked || missingKey === '') return;
    attemptedOnCreate.current = true;
    void generate(missingKey.split(','));
  }, [createdFlag, canTranslate, busy, blocked, missingKey, generate]);

  if (capabilities.isPending) return <SkeletonText lines={2} />;
  if (capabilities.error) return <FunctionErrorState error={capabilities.error} onRetry={() => void capabilities.refetch()} />;
  if (!canTranslate) return <InlineAlert tone="info">{t('fnAdmin.autoUnavailable')}</InlineAlert>;
  if (!isDraft) return null;

  return (
    <div className="space-y-3 rounded-card-sm bg-surface p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-pill bg-background text-foreground" aria-hidden="true">
          <SparklesIcon className="h-4 w-4" />
        </span>
        <div className="min-w-0 text-sm">
          <p className="font-medium text-foreground">{t('fnAdmin.autoTitle', 'Automatic translation')}</p>
          {missing.length > 0 ? (
            <p className="mt-0.5 text-secondary">
              {t('fnAdmin.translationGaps')} <span className="micro">{missing.join(', ')}</span>
            </p>
          ) : (
            <p className="mt-0.5 text-secondary">{t('fnAdmin.allTranslated', 'Every active language is covered.')}</p>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {missing.length > 0 && (
          <Button variant="dark" size="sm" icon={<SparklesIcon />} loading={translate.isPending} disabled={blocked || busy} onClick={() => void generate(missing)}>
            {t('fnAdmin.translate')}
          </Button>
        )}
        {machine && language !== record.sourceLanguage && (
          <Button variant="outline" size="sm" icon={<RefreshCwIcon />} disabled={blocked || busy} onClick={() => void generate([language], true)}>
            {t('fnAdmin.regenerate')}
          </Button>
        )}
      </div>
      {Boolean(error) && (
        <InlineAlert
          tone="danger"
          action={
            <Button
              variant="outline"
              size="sm"
              disabled={blocked || busy}
              onClick={() => {
                const attempt = lastAttempt.current;
                if (attempt) void generate(attempt.languages, attempt.overwriteMachine);
              }}
            >
              {t('fnAdmin.retryLater')}
            </Button>
          }
        >
          {errorMessage(error, t)}
        </InlineAlert>
      )}
    </div>
  );
}
