import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { I18nProvider } from './contexts/I18nContext';
import { AuthProvider } from './contexts/AuthContext';
import { PublicLayout } from './components/layout/PublicLayout';
import { AdminLayout } from './components/layout/AdminLayout';
import { RequireAuth } from './components/auth/RequireAuth';
import { Home } from './pages/Home';
import { OrganizationDetail } from './pages/OrganizationDetail';
import { FunctionDetail } from './pages/FunctionDetail';
import { Login } from './pages/Login';
import { NotFound } from './pages/NotFound';
import { SecuritySettings } from './pages/SecuritySettings';
import { Dashboard } from './pages/admin/Dashboard';
import { Organizations } from './pages/admin/Organizations';
import { OrgAdmins } from './pages/admin/OrgAdmins';
import { Moderators } from './pages/admin/Moderators';
import { Roles } from './pages/admin/Roles';
import { Languages } from './pages/admin/Languages';
import { LegacyUsers } from './pages/admin/LegacyUsers';
import { FunctionRequirements } from './pages/admin/FunctionRequirements';

export function App() {
  return (
    <BrowserRouter>
      <I18nProvider>
        <AuthProvider>
          <Routes>
            {/* Public catalogue */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/organizations/:id" element={<OrganizationDetail />} />
              <Route path="/functions/:id" element={<FunctionDetail />} />
              <Route path="*" element={<NotFound />} />
            </Route>

            <Route path="/login" element={<Login />} />

            {/* Staff area — role-aware */}
            <Route element={<RequireAuth />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin" element={<Dashboard />} />
                <Route path="/admin/organizations" element={<Organizations />} />
                <Route path="/settings/security" element={<SecuritySettings />} />

                <Route element={<RequireAuth roles={['ROLE_SUPER_ADMIN', 'ROLE_ORG_ADMIN']} />}>
                  <Route path="/admin/moderators" element={<Moderators />} />
                  <Route path="/admin/functions/:id/edit" element={<FunctionRequirements />} />
                </Route>

                <Route element={<RequireAuth roles={['ROLE_SUPER_ADMIN']} />}>
                  <Route path="/admin/org-admins" element={<OrgAdmins />} />
                  <Route path="/admin/roles" element={<Roles />} />
                  <Route path="/admin/languages" element={<Languages />} />
                  <Route path="/admin/users" element={<LegacyUsers />} />
                </Route>
              </Route>
            </Route>
          </Routes>

          <Toaster position="top-right" richColors closeButton />
        </AuthProvider>
      </I18nProvider>
    </BrowserRouter>);

}