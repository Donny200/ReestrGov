import type { FunctionQuery } from '../types/api';

export const organizationKeys = {
  all: ['organizations'] as const,
  list: () => [...organizationKeys.all, 'list'] as const,
  public: () => [...organizationKeys.all, 'public'] as const,
  publicDetail: (id: number) => [...organizationKeys.all, 'public-detail', id] as const,
};

export const staffKeys = {
  all: ['staff'] as const,
  orgAdmins: () => [...staffKeys.all, 'org-admins'] as const,
  orgAdminCandidates: () => [...staffKeys.all, 'org-admin-candidates'] as const,
  moderators: () => [...staffKeys.all, 'moderators'] as const,
  moderatorCandidates: () => [...staffKeys.all, 'moderator-candidates'] as const,
};

export const roleKeys = {
  all: ['roles'] as const,
  list: () => [...roleKeys.all, 'list'] as const,
  permissions: () => [...roleKeys.all, 'permissions'] as const,
  assignmentCandidates: () => [...roleKeys.all, 'assignment-candidates'] as const,
};

export const languageKeys = {
  all: ['languages'] as const,
  list: () => [...languageKeys.all, 'list'] as const,
};

export const legacyUserKeys = {
  all: ['legacy-users'] as const,
  list: () => [...legacyUserKeys.all, 'list'] as const,
};

export const referenceKeys = {
  regions: ['regions'] as const,
};

export const functionKeys = {
  all: ['functions'] as const,
  admin: () => [...functionKeys.all, 'admin'] as const,
  detail: (id: number) => [...functionKeys.all, 'detail', id] as const,
  audit: (id: number) => [...functionKeys.all, 'audit', id] as const,
  categories: () => [...functionKeys.all, 'categories'] as const,
  capabilities: () => [...functionKeys.all, 'capabilities'] as const,
  publicList: (query: FunctionQuery) => [...functionKeys.all, 'public', query] as const,
  publicDetail: (id: number) => [...functionKeys.all, 'public-detail', id] as const,
  options: (global: boolean, userId: number | null) => [...functionKeys.all, 'options', global, userId] as const,
};
