import { Badge } from '../ui/Badge';
import { useI18n } from '../../contexts/i18n';
import type { FunctionStatus } from '../../types/adminFunctions';

export const FUNCTION_STATUSES: FunctionStatus[] = ['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'DEACTIVATED'];
const tones = { DRAFT: 'gray', PENDING_REVIEW: 'amber', PUBLISHED: 'green', DEACTIVATED: 'red' } as const;
export const statusLabels = { DRAFT: 'Draft', PENDING_REVIEW: 'Pending review', PUBLISHED: 'Published', DEACTIVATED: 'Deactivated' };
export function FunctionStatusBadge({ status }: { status: FunctionStatus }) {
  const { t } = useI18n();
  return <Badge tone={tones[status]}>{t('fnAdmin.status.' + status, statusLabels[status])}</Badge>;
}
