import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useI18n } from '../../contexts/i18n';
import { lastNotifiedReply, rememberNotifiedReply } from './supportActivity';
import { useSupportBadge } from './useSupportBadge';

/** In-app notice: announces each new support reply once while the visitor browses the public site. */
export function SupportReplyNotifier() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const unread = useSupportBadge();

  useEffect(() => {
    const latest = unread?.latestReplyId ?? 0;
    if (!unread || unread.unread === 0 || latest <= lastNotifiedReply()) return;
    rememberNotifiedReply(latest);
    if (location.pathname === '/support') return;
    toast.info(t('support.replyArrived', 'Support replied to your message'), {
      action: { label: t('support.openSupport', 'Open support'), onClick: () => navigate('/support') },
    });
  }, [unread, location.pathname, navigate, t]);

  return null;
}
