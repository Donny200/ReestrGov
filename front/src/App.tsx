import { lazy, Suspense } from 'react';
import type { ReactNode } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Loader2Icon } from 'lucide-react';
import { Toaster } from 'sonner';
import { I18nProvider } from './contexts/I18nContext';
import { AuthProvider } from './contexts/AuthContext';
import { PublicLayout } from './components/layout/PublicLayout';
import { AdminLayout } from './components/layout/AdminLayout';
import { RequireAuth } from './components/auth/RequireAuth';
import { AppErrorBoundary } from './components/ui/AppErrorBoundary';
import { useI18n } from './contexts/i18n';
import { FUNCTION_PERMISSIONS } from './utils/functionPermissions';

const CreateFunctionPage = lazy(() => import('./pages/admin/CreateFunctionPage').then(module => ({ default: module.CreateFunctionPage })));
const AdminFunctionsPage = lazy(() => import('./pages/admin/AdminFunctionsPage').then(module => ({ default: module.AdminFunctionsPage })));

const Home = lazy(() => import('./pages/Home').then((module) => ({ default: module.Home })));
const OrganizationDetail = lazy(() =>
  import('./pages/OrganizationDetail').then((module) => ({ default: module.OrganizationDetail }))
);
const FunctionDetail = lazy(() =>
  import('./pages/FunctionDetail').then((module) => ({ default: module.FunctionDetail }))
);
const Login = lazy(() => import('./pages/Login').then((module) => ({ default: module.Login })));
const NotFound = lazy(() => import('./pages/NotFound').then((module) => ({ default: module.NotFound })));
const SecuritySettings = lazy(() =>
  import('./pages/SecuritySettings').then((module) => ({ default: module.SecuritySettings }))
);
const Dashboard = lazy(() =>
  import('./pages/admin/Dashboard').then((module) => ({ default: module.Dashboard }))
);
const Organizations = lazy(() =>
  import('./pages/admin/Organizations').then((module) => ({ default: module.Organizations }))
);
const OrgAdmins = lazy(() =>
  import('./pages/admin/OrgAdmins').then((module) => ({ default: module.OrgAdmins }))
);
const Moderators = lazy(() =>
  import('./pages/admin/Moderators').then((module) => ({ default: module.Moderators }))
);
const Roles = lazy(() => import('./pages/admin/Roles').then((module) => ({ default: module.Roles })));
const Languages = lazy(() =>
  import('./pages/admin/Languages').then((module) => ({ default: module.Languages }))
);
const LegacyUsers = lazy(() =>
  import('./pages/admin/LegacyUsers').then((module) => ({ default: module.LegacyUsers }))
);
const FunctionRequirements = lazy(() =>
  import('./pages/admin/FunctionRequirements').then((module) => ({ default: module.FunctionRequirements }))
);

function RouteLoading() {
  const { t } = useI18n();
  return (
    <div className="flex min-h-[45vh] items-center justify-center" role="status" aria-live="polite">
      <span className="inline-flex items-center gap-3 text-sm font-medium text-navy-500">
        <Loader2Icon className="h-5 w-5 animate-spin text-teal-600" aria-hidden="true" />
        {t('state.loading')}
      </span>
    </div>
  );
}

function PageBoundary({ children }: { children: ReactNode }) {
  return <Suspense fallback={<RouteLoading />}>{children}</Suspense>;
}

export function App() {
  return (
    <BrowserRouter>
      <I18nProvider>
        <AuthProvider>
          <AppErrorBoundary>
            <Routes>
            {/* Public catalogue */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<PageBoundary><Home /></PageBoundary>} />
              <Route path="/organizations/:id" element={<PageBoundary><OrganizationDetail /></PageBoundary>} />
              <Route path="/functions/:id" element={<PageBoundary><FunctionDetail /></PageBoundary>} />
              <Route path="*" element={<PageBoundary><NotFound /></PageBoundary>} />
            </Route>

            <Route path="/login" element={<PageBoundary><Login /></PageBoundary>} />

            {/* Staff area — role-aware */}
            <Route element={<RequireAuth />}>
              <Route element={<AdminLayout />}>
                <Route element={<RequireAuth anyPermissions={FUNCTION_PERMISSIONS} />}><Route path="/admin/functions" element={<PageBoundary><AdminFunctionsPage /></PageBoundary>} /></Route>
                <Route element={<RequireAuth anyPermissions={['FUNCTIONS_CREATE']} />}><Route path="/admin/functions/new" element={<PageBoundary><CreateFunctionPage /></PageBoundary>} /></Route>
                <Route path="/admin" element={<PageBoundary><Dashboard /></PageBoundary>} />
                <Route path="/admin/organizations" element={<PageBoundary><Organizations /></PageBoundary>} />
                <Route path="/settings/security" element={<PageBoundary><SecuritySettings /></PageBoundary>} />

                <Route element={<RequireAuth roles={['ROLE_SUPER_ADMIN', 'ROLE_ORG_ADMIN']} />}>
                  <Route path="/admin/moderators" element={<PageBoundary><Moderators /></PageBoundary>} />
                  <Route path="/admin/functions/:id/edit" element={<PageBoundary><FunctionRequirements /></PageBoundary>} />
                </Route>

                <Route element={<RequireAuth roles={['ROLE_SUPER_ADMIN']} />}>
                  <Route path="/admin/org-admins" element={<PageBoundary><OrgAdmins /></PageBoundary>} />
                  <Route path="/admin/roles" element={<PageBoundary><Roles /></PageBoundary>} />
                  <Route path="/admin/languages" element={<PageBoundary><Languages /></PageBoundary>} />
                  <Route path="/admin/users" element={<PageBoundary><LegacyUsers /></PageBoundary>} />
                </Route>
              </Route>
            </Route>
            </Routes>

            <Toaster position="top-right" richColors closeButton expand visibleToasts={4} />
          </AppErrorBoundary>
        </AuthProvider>
      </I18nProvider>
    </BrowserRouter>);

}
