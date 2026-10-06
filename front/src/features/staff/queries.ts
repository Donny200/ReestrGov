import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createModerator,
  createOrgAdmin,
  deactivateModerator,
  deactivateOrgAdmin,
  getModeratorCandidates,
  getModerators,
  getOrgAdminCandidates,
  getOrgAdmins,
  promoteModerator,
  promoteOrgAdmin,
  updateModerator,
  updateOrgAdmin,
} from '../../services/staffService';
import type { UpdateModeratorRequest, UpdateOrgAdminRequest } from '../../types/api';
import { legacyUserKeys, roleKeys, staffKeys } from '../queryKeys';

export const useOrgAdmins = () => useQuery({ queryKey: staffKeys.orgAdmins(), queryFn: getOrgAdmins });
export const useOrgAdminCandidates = () => useQuery({ queryKey: staffKeys.orgAdminCandidates(), queryFn: getOrgAdminCandidates });
export const useModerators = () => useQuery({ queryKey: staffKeys.moderators(), queryFn: getModerators });
export const useModeratorCandidates = () => useQuery({ queryKey: staffKeys.moderatorCandidates(), queryFn: getModeratorCandidates });

export function useStaffMutation<TVariables, TResult>(mutationFn: (variables: TVariables) => Promise<TResult>) {
  const client = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () =>
      Promise.all([
        client.invalidateQueries({ queryKey: staffKeys.all }),
        client.invalidateQueries({ queryKey: legacyUserKeys.all }),
        client.invalidateQueries({ queryKey: roleKeys.assignmentCandidates() }),
      ]),
  });
}

export const useCreateOrgAdmin = () => useStaffMutation(createOrgAdmin);
export const usePromoteOrgAdmin = () => useStaffMutation(promoteOrgAdmin);
export const useUpdateOrgAdmin = () =>
  useStaffMutation(({ id, payload }: { id: number; payload: UpdateOrgAdminRequest }) => updateOrgAdmin(id, payload));
export const useDeactivateOrgAdmin = () => useStaffMutation((id: number) => deactivateOrgAdmin(id));

export const useCreateModerator = () => useStaffMutation(createModerator);
export const usePromoteModerator = () => useStaffMutation(promoteModerator);
export const useUpdateModerator = () =>
  useStaffMutation(({ id, payload }: { id: number; payload: UpdateModeratorRequest }) => updateModerator(id, payload));
export const useDeactivateModerator = () => useStaffMutation((id: number) => deactivateModerator(id));
