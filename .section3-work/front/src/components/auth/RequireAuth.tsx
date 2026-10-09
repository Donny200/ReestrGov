import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loader2Icon, LockIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import type { RoleName } from '../../types/api';
import { EmptyState } from '../ui/States';

/** Guards admin routes. Restricted sections render a forbidden state, never a blank page. */
export function RequireAuth({ roles }: {roles?: RoleName[];}) {
  const { user, initializing } = useAuth();
  const location = useLocation();

  if (initializing) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#f4f6f9]">
        <Loader2Icon className="h-6 w-6 animate-spin text-teal-600" aria-label="Yuklanmoqda" />
      </div>);

  }

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  if (user.mustChangePassword && location.pathname !== '/settings/security') {
    return <Navigate to="/settings/security" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="mx-auto w-full max-w-xl px-4 py-16">
        <div className="rounded-xl border border-navy-100 bg-white shadow-card">
          <EmptyState
            title="Ruxsat yo‘q"
            description="Sizda ushbu amal uchun ruxsat yo‘q"
            icon={<LockIcon className="h-5 w-5" />} />
          
        </div>
      </div>);

  }

  return <Outlet />;
}
