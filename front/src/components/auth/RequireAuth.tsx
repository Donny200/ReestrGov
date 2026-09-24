import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loader2Icon, LockIcon } from 'lucide-react';
import { useAuth } from '../../contexts/auth';
import type { RoleName } from '../../types/api';
import { EmptyState } from '../ui/States';
import { useI18n } from '../../contexts/i18n';

/** Guards admin routes. Restricted sections render a forbidden state, never a blank page. */
export function RequireAuth({ roles, anyPermissions }: {roles?: RoleName[]; anyPermissions?: readonly string[];}) {
  const { user, initializing, hasPermission } = useAuth();
  const { t } = useI18n();
  const location = useLocation();

  if (initializing) {
    return (
      <div className="flex min-h-dvh w-full items-center justify-center bg-navy-50">
        <Loader2Icon className="h-6 w-6 animate-spin text-teal-600" aria-label={t('state.loading')} />
      </div>);

  }

  if (!user) {
    const from = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to="/login" replace state={{ from }} />;
  }

  if (user.mustChangePassword && location.pathname !== '/settings/security') {
    return <Navigate to="/settings/security" replace />;
  }

  if ((roles && !roles.includes(user.role)) || (anyPermissions && !anyPermissions.some(hasPermission))) {
    return (
      <div className="mx-auto w-full max-w-xl px-4 py-16">
        <div className="rounded-xl border border-navy-100 bg-white shadow-card">
          <EmptyState
            title={t('state.forbidden')}
            icon={<LockIcon className="h-5 w-5" />} />
          
        </div>
      </div>);

  }

  return <Outlet />;
}
