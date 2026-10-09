import type { VerificationStatus } from '../types/api';

export const VERIFICATION_STATUSES: VerificationStatus[] = ['UNVERIFIED', 'VERIFIED', 'DUE', 'OUTDATED'];

export const verificationLabels: Record<VerificationStatus, string> = {
  UNVERIFIED: 'Not verified',
  VERIFIED: 'Verified',
  DUE: 'Recheck due',
  OUTDATED: 'Changed since verification',
};

export function needsRecheck(status: VerificationStatus | undefined): boolean {
  return status !== 'VERIFIED';
}

export type VerificationFilter = '' | 'due' | 'verified';

export function matchesVerification(status: VerificationStatus | undefined, filter: VerificationFilter): boolean {
  if (filter === 'due') return needsRecheck(status);
  if (filter === 'verified') return !needsRecheck(status);
  return true;
}

export function parseVerificationFilter(value: string | null): VerificationFilter {
  return value === 'due' || value === 'verified' ? value : '';
}
