import { MessageCircleQuestionIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { buttonVariants } from '../../components/ui/buttonVariants';
import { useI18n } from '../../contexts/i18n';
import { cn } from '../../lib/cn';

export function AskQuestionLink({ serviceId, className }: { serviceId: number; className?: string }) {
  const { t } = useI18n();
  return (
    <Link to={`/help?service=${serviceId}`} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'print:hidden', className)}>
      <MessageCircleQuestionIcon aria-hidden="true" />
      {t('help.askAboutService', 'Ask a question')}
    </Link>
  );
}
