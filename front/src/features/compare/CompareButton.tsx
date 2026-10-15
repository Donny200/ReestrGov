import { ColumnsIcon, MinusIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/Button';
import { useI18n } from '../../contexts/i18n';
import { cn } from '../../lib/cn';
import { useCompare } from './useCompare';

interface CompareButtonProps {
  service: { id: number; name: string };
  compact?: boolean;
  className?: string;
}

export function CompareButton({ service, compact = false, className }: CompareButtonProps) {
  const { t } = useI18n();
  const { isSelected, add, remove, full, limit } = useCompare();
  const selected = isSelected(service.id);
  const label = selected ? t('compare.remove', 'Remove from comparison') : t('compare.add', 'Compare');

  const toggle = () => {
    if (selected) {
      remove(service.id);
      toast.success(t('compare.removed', 'Removed from the comparison'));
      return;
    }
    if (full) {
      toast.error(t('compare.full', `You can compare up to ${limit} services. Remove one to add another.`));
      return;
    }
    if (add(service.id)) toast.success(t('compare.added', 'Added to the comparison'));
  };

  const Icon = selected ? MinusIcon : ColumnsIcon;
  if (compact) {
    return (
      <Button variant={selected ? 'dark' : 'outline'} size="iconSm" aria-pressed={selected} aria-label={`${label}: ${service.name}`} title={label} onClick={toggle} className={cn('print:hidden', className)}>
        <Icon aria-hidden="true" />
      </Button>
    );
  }
  return (
    <Button variant={selected ? 'dark' : 'outline'} size="sm" aria-pressed={selected} icon={<Icon />} onClick={toggle} className={cn('print:hidden', className)}>
      {selected ? t('compare.selected', 'In comparison') : t('compare.add', 'Compare')}
    </Button>
  );
}
