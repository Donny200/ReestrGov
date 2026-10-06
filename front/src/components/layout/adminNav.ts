import { FUNCTION_PERMISSIONS } from '../../utils/functionPermissions';
import type { RoleName } from '../../types/api';

export interface AdminNavItem {
  to: string;
  labelKey: string;
  icon: 'dashboard' | 'building' | 'shield' | 'users' | 'key' | 'globe' | 'legacy' | 'lock' | 'functions';
  roles: RoleName[];
  anyPermissions?: readonly string[];
  end?: boolean;
  dividerBefore?: boolean;
}

export const adminNav: AdminNavItem[] = [
{ to: '/admin/functions', labelKey: 'nav.functions', icon: 'functions', roles: [], anyPermissions: FUNCTION_PERMISSIONS },
{
  to: '/admin',
  labelKey: 'nav.dashboard',
  icon: 'dashboard',
  roles: ['ROLE_SUPER_ADMIN', 'ROLE_ORG_ADMIN', 'ROLE_MODERATOR'],
  end: true
},
{
  to: '/admin/organizations',
  labelKey: 'nav.organizations',
  icon: 'building',
  roles: ['ROLE_SUPER_ADMIN', 'ROLE_ORG_ADMIN', 'ROLE_MODERATOR']
},
{
  to: '/admin/org-admins',
  labelKey: 'nav.orgAdmins',
  icon: 'shield',
  roles: ['ROLE_SUPER_ADMIN'],
  dividerBefore: true
},
{
  to: '/admin/moderators',
  labelKey: 'nav.moderators',
  icon: 'users',
  roles: ['ROLE_SUPER_ADMIN', 'ROLE_ORG_ADMIN']
},
{ to: '/admin/roles', labelKey: 'nav.roles', icon: 'key', roles: ['ROLE_SUPER_ADMIN'] },
{ to: '/admin/languages', labelKey: 'nav.languages', icon: 'globe', roles: ['ROLE_SUPER_ADMIN'] },
{ to: '/admin/users', labelKey: 'nav.legacyUsers', icon: 'legacy', roles: ['ROLE_SUPER_ADMIN'] },
{
  to: '/settings/security',
  labelKey: 'nav.security',
  icon: 'lock',
  roles: ['ROLE_SUPER_ADMIN', 'ROLE_ORG_ADMIN', 'ROLE_MODERATOR'],
  dividerBefore: true
}];


export function navForRole(role: RoleName | undefined, permissions: string[] = []): AdminNavItem[] {
  if (!role) return [];
  return adminNav.filter((item) => item.anyPermissions ? item.anyPermissions.some((permission) => permissions.includes(permission)) : item.roles.includes(role));
}
