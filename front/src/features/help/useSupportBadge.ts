import { useAuth } from '../../contexts/auth';
import { useSupportUnread } from './queries';
import { supportActive } from './supportActivity';

/** Unread staff replies for the public navigation; polls only where a support thread can exist. */
export function useSupportBadge() {
  const { user } = useAuth();
  return useSupportUnread(Boolean(user) || supportActive()).data;
}
