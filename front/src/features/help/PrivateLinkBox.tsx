import { useId } from 'react';
import { CopyIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useI18n } from '../../contexts/i18n';
import { copyText } from '../../utils/share';

/** The visitor's only key to the conversation: shown read-only with a copy action and a plain explanation. */
export function PrivateLinkBox({ link }: { link: string }) {
  const { t } = useI18n();
  const id = useId();
  const copy = async () => {
    if (await copyText(link)) toast.success(t('help.linkCopied', 'Private link copied'));
    else toast.error(t('help.copyFailed', 'Copy the link manually from the field'));
  };
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-semibold text-foreground">{t('help.privateLink', 'Your private link')}</label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input id={id} readOnly value={link} className="min-h-10 py-2 font-mono text-xs" onFocus={(event) => event.currentTarget.select()} />
        <Button variant="dark" size="sm" icon={<CopyIcon />} onClick={() => void copy()} className="shrink-0">
          {t('help.copyLink', 'Copy link')}
        </Button>
      </div>
      <p className="text-sm leading-6 text-secondary">
        {t('help.linkExplanation', 'Save or bookmark this link: it is the only way to read the reply and to write again. Anyone with the link can read the conversation, so do not share it.')}
      </p>
    </div>
  );
}
