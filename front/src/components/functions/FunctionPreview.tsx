import { useI18n } from '../../contexts/i18n';
import { Panel, PanelBody, PanelHeader } from '../ui/Card';
import { functionText, hasFunctionTranslation } from '../../utils/functionLocalization';
import type { AdminFunction } from '../../types/adminFunctions';

export function FunctionPreview({ record }: { record: AdminFunction }) {
  const { t, locale } = useI18n();
  return <Panel className="mb-5">
    <PanelHeader title={t('fnAdmin.preview')} description={locale.toUpperCase()} />
    <PanelBody>
      <h2 className="font-semibold">{functionText(record, 'name', locale)}</h2>
      <p className="mt-2 whitespace-pre-wrap text-sm text-content-muted">{functionText(record, 'description', locale)}</p>
      {!hasFunctionTranslation(record, locale) && <p className="mt-2 text-xs text-amber-700">{t('fnAdmin.missingTranslation')}</p>}
    </PanelBody>
  </Panel>;
}
