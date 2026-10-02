import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createLegacyUser, deactivateLegacyUser, getLegacyUsers, updateLegacyUser } from '../../services/legacyUserService';
import type { UpdateLegacyUserRequest } from '../../types/api';
import { legacyUserKeys, roleKeys, staffKeys } from '../queryKeys';

export const useLegacyUsers = () => useQuery({ queryKey: legacyUserKeys.list(), queryFn: getLegacyUsers });

function useLegacyUserMutation<TVariables, TResult>(mutationFn: (variables: TVariables) => Promise<TResult>) {
  const client = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () =>
      Promise.all([
        client.invalidateQueries({ queryKey: legacyUserKeys.all }),
        client.invalidateQueries({ queryKey: staffKeys.all }),
        client.invalidateQueries({ queryKey: roleKeys.assignmentCandidates() }),
      ]),
  });
}

export const useCreateLegacyUser = () => useLegacyUserMutation(createLegacyUser);
export const useUpdateLegacyUser = () =>
  useLegacyUserMutation(({ id, payload }: { id: number; payload: UpdateLegacyUserRequest }) => updateLegacyUser(id, payload));
export const useDeactivateLegacyUser = () => useLegacyUserMutation((id: number) => deactivateLegacyUser(id));
