
export type RoleName =
'ROLE_SUPER_ADMIN' |
'ROLE_ORG_ADMIN' |
'ROLE_MODERATOR' |
'ROLE_USER';

export interface AuthUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: RoleName;
  enabled: boolean;
  mustChangePassword: boolean;
  permissions: string[];
  organizations: { id: number; name: string }[];
  organizationIds: number[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ChangePasswordRequest {
    currentPassword: string;
  newPassword: string;
}

export interface Organization {
  id: number;
  name: string;
  description: string | null;
  nameTranslations?: Record<string, TranslatedText>;
  descriptionTranslations?: Record<string, TranslatedText>;
  enabled: boolean;
  createdAt: string;
}

export interface PublicOrganization {
  id: number;
  name: string;
  description: string | null;
  nameTranslations?: Record<string, TranslatedText>;
  descriptionTranslations?: Record<string, TranslatedText>;
}

export interface TranslatedText {
  text: string;
  source: 'human' | 'machine';
}

export interface CreateOrganizationRequest {
  name: string;
  description: string | null;
}

export interface UpdateOrganizationRequest {
  name?: string | null;
  description?: string | null;
}

export interface StaffUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: string;
  enabled: boolean;
  organizationIds: number[];
}

export interface CreateOrgAdminRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  organizationId: number;
}

export interface PromoteOrgAdminRequest {
  userId: number;
  organizationId: number;
}

export interface UpdateOrgAdminRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  organizationId?: number;
  enabled?: boolean;
}

export interface CreateModeratorRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  organizationIds: number[];
}

export interface PromoteModeratorRequest {
  userId: number;
  organizationIds: number[];
}

export interface UpdateModeratorRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
    organizationIds: number[];
  enabled?: boolean;
}

export interface Permission {
  id: number;
  code: string;
  name: string;
  category: string | null;
}

export interface CreatePermissionRequest {
  code: string;
  name: string;
  category?: string;
}

export interface RoleEntity {
  id: number;
  name: string;
  permissions: Permission[];
}

export interface CreateRoleRequest {
  name: string;
}

export interface AssignRoleRequest {
  userId: number;
  roleId: number;
}

export interface UpdateRolePermissionsRequest {
  permissionIds: number[];
}

export interface Region {
  id: number;
  name: string;
  code: string;
}

export interface Language {
  id: number;
  code: string;
  name: string;
  nativeName: string | null;
  defaultLanguage: boolean;
}

export interface LanguageSearchResult {
  code: string;
  name: string;
  nativeName: string;
  alreadyAdded: boolean;
}

export interface CatalogFunction {
  id: number;
  name: string;
  description: string | null;
  organizationId: number;
  requirements: string | null;
  category: string | null;
  nameTranslations?: Record<string, TranslatedText>;
  descriptionTranslations?: Record<string, TranslatedText>;
}

export interface UpdateFunctionRequirementsRequest {
  requirements: string;
}

export interface FunctionQuery {
  organizationId?: number;
  category?: string;
}

export interface LegacyUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: string;
  enabled: boolean;
  organizations: number[];
}

export interface LegacyUserApi {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: string;
  enabled: boolean;
  organizationIds: number[];
}

export interface CreateLegacyUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  roleId: number;
  organizationIds: number[];
}

export interface UpdateLegacyUserRequest {
  firstName: string;
  lastName: string;
  email: string;
}
