import type { UseQueryResult } from '@tanstack/react-query';
import type { StaffUser } from '../../types/api';

export type OrganizationMode = 'single' | 'multiple';

export interface StaffCreateValues {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  organizationIds: number[];
}

export interface StaffEditValues {
  firstName: string;
  lastName: string;
  phone: string;
  organizationIds: number[];
  enabled: boolean;
}

export interface StaffConfig {
  kind: 'org-admins' | 'moderators';
  titleKey: string;
  createKey: string;
  descriptionKey?: string;
  organizations: OrganizationMode;
  useList: () => UseQueryResult<StaffUser[], Error>;
  useCandidates: () => UseQueryResult<StaffUser[], Error>;
  create: (values: StaffCreateValues) => Promise<StaffUser>;
  promote: (userId: number, organizationIds: number[]) => Promise<StaffUser>;
  update: (id: number, values: StaffEditValues) => Promise<StaffUser>;
  deactivate: (id: number) => Promise<void>;
}
