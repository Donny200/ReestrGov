import type { RoleName } from '../../types/api';

export interface AdminNavItem {
  to: string;
  labelKey: string;
  icon: 'dashboard' | 'building' | 'shield' | 'users' | 'key' | 'globe' | 'legacy' | 'lock' | 'catalog';
  roles: RoleName[];
  end?: boolean;
}

/**
 * Role-aware navigation.
 * SUPER_ADMIN: everything. ORG_ADMIN: organizations, moderators, catalog.
 * MODERATOR: read-only catalog + own security settings.
 */
export const adminNav: AdminNavItem[] = [
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
{ to: '/admin/org-admins', labelKey: 'nav.orgAdmins', icon: 'shield', roles: ['ROLE_SUPER_ADMIN'] },
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
  roles: ['ROLE_SUPER_ADMIN', 'ROLE_ORG_ADMIN', 'ROLE_MODERATOR']
}];


export function navForRole(role: RoleName | undefined): AdminNavItem[] {
  if (!role) return [];
  return adminNav.filter((item) => item.roles.includes(role));
}