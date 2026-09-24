import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useAsync } from '../../hooks/useAsync';
import { useI18n } from '../../contexts/i18n';
import { getTranslationCapabilities, translateFunction } from '../../services/adminFunctionService';
import { hasFunctionTranslation } from '../../utils/functionLocalization';
import { Button } from '../ui/Button';
import { ErrorState, LoadingState } from '../ui/States';
import type { AdminFunction } from '../../types/adminFunctions';

interface Props {
  record: AdminFunction; language: string; blocked: boolean; busy: boolean;
  onBusy: (busy: boolean) => void; onUpdate: (record: AdminFunction) => void;
}
export function FunctionAutoTranslate({ record, language, blocked, busy, onBusy, onUpdate }: Props) {
  const { t, available } = useI18n();
  const location = useLocation();
  const capabilities = useAsync(getTranslationCapabilities, []);
  const [error, setError] = useState<unknown>(null);
  const [running, setRunning] = useState(false);
  const attemptedCreate = useRef(false);
  const lastAttempt = useRef<{ languages: string[]; overwrite: boolean } | null>(null);
  const missing = available.map(lang => lang.code).filter(code => !hasFunctionTranslation(record, code));
  const machine = record.nameTranslations?.[language]?.source === 'machine' || record.descriptionTranslations?.[language]?.source === 'machine';
  const generate = useCallback(async (languages: string[], overwrite = false) => {
    if (busy || blocked || !capabilities.data?.available || record.status !== 'DRAFT') return;
    lastAttempt.current = { languages, overwrite };
    setError(null); setRunning(true); onBusy(true);
    try {
      const saved = await translateFunction(record.id, languages, overwrite);
      onUpdate(saved); toast.success(t('fnAdmin.translationSuccess'));
    } catch (failure) { setError(failure); } finally { onBusy(false); setRunning(false); }
  }, [busy, blocked, capabilities.data, record.id, record.status, onBusy, onUpdate, t]);
  useEffect(() => {
    if (capabilities.data?.available === false) console.info('Azure Translator is not configured on function-catalog-service (AZURE_TRANSLATOR_ENDPOINT/KEY/REGION).');
  }, [capabilities.data]);
  useEffect(() => {
    if (!attemptedCreate.current && location.state?.created && capabilities.data?.available && !busy && !blocked && missing.length) {
      attemptedCreate.current = true;
      void generate(missing);
    }
  }, [location.state, capabilities.data, busy, blocked, missing, generate]);

  if (capabilities.loading) return <LoadingState />;
  if (capabilities.error) return <ErrorState error={capabilities.error} onRetry={capabilities.reload} />;
  if (!capabilities.data?.available) return <p className="text-sm text-content-muted">{t('fnAdmin.autoUnavailable')}</p>;
  if (record.status !== 'DRAFT') return null;
  return <div className="space-y-3 rounded-control border border-line p-4">
    {missing.length > 0 && <div>
      <p className="mb-3 text-sm text-content-muted">{t('fnAdmin.translationGaps')} {missing.join(', ')}</p>
      <Button variant="outline" loading={running} disabled={blocked || busy} onClick={() => void generate(missing)}>
        {t('fnAdmin.translate')}
      </Button>
    </div>}
    {machine && language !== record.sourceLanguage && <Button variant="outline" loading={running} disabled={blocked || busy}
      onClick={() => void generate([language], true)}>{t('fnAdmin.regenerate')}</Button>}
    {Boolean(error) && <><ErrorState error={error} />
      <Button variant="outline" disabled={blocked || busy} onClick={() => {
        const attempt = lastAttempt.current;
        if (attempt) void generate(attempt.languages, attempt.overwrite);
      }}>{t('fnAdmin.retryLater')}</Button></>}
  </div>;
}
