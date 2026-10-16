import { ShieldAlertIcon } from 'lucide-react';
import { useI18n } from '../../contexts/i18n';

export function SensitiveDataNotice() {
  const { t } = useI18n();
  return (
    <p className="flex items-start gap-2.5 rounded-control bg-status-pending-bg px-4 py-3 text-sm leading-6 text-status-pending">
      <ShieldAlertIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>
        {t('help.sensitiveNotice', 'Do not write passwords, personal identification (PINFL), passport or bank card numbers, and do not attach or copy documents or other sensitive personal information. They are not needed to answer a question.')}
      </span>
    </p>
  );
}
