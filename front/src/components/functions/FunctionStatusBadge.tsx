import { Badge } from '../ui/Badge';
import { useI18n } from '../../contexts/i18n';
import { statusLabels, type FunctionStatus } from '../../types/adminFunctions';

const tones = { DRAFT: 'gray', PENDING_REVIEW: 'amber', PUBLISHED: 'green', DEACTIVATED: 'red' } as const;
export function FunctionStatusBadge({ status }: { status: FunctionStatus }) {
  const { t } = useI18n();
  return <Badge tone={tones[status]}>{t('fnAdmin.status.' + status, statusLabels[status])}</Badge>;
}
