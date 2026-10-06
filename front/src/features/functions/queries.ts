import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/auth';
import {
  createFunction,
  deactivateFunction,
  getAdminFunction,
  getAdminFunctions,
  getFunctionAudit,
  getFunctionCategories,
  getTranslationCapabilities,
  saveFunctionTranslation,
  transitionFunction,
  translateFunction,
  updateFunction,
} from '../../services/adminFunctionService';
import { getFunction, getFunctions, updateFunctionRequirements } from '../../services/functionService';
import { getPublicOrganizations } from '../../services/organizationService';
import type {
  AdminFunction,
  CreateFunctionRequest,
  FunctionCategory,
  FunctionOrganization,
  FunctionTransition,
  UpdateFunctionRequest,
} from '../../types/adminFunctions';
import type { FunctionQuery } from '../../types/api';
import { functionKeys } from '../queryKeys';

export const useAdminFunctions = (enabled = true) =>
  useQuery({ queryKey: functionKeys.admin(), queryFn: getAdminFunctions, enabled });

export const useAdminFunction = (id: number) =>
  useQuery({ queryKey: functionKeys.detail(id), queryFn: () => getAdminFunction(id), enabled: Number.isFinite(id) });

export const useFunctionCategories = () =>
  useQuery({ queryKey: functionKeys.categories(), queryFn: getFunctionCategories, staleTime: 5 * 60_000 });

export const useFunctionAudit = (id: number) =>
  useQuery({ queryKey: functionKeys.audit(id), queryFn: () => getFunctionAudit(id) });

export const useTranslationCapabilities = () =>
  useQuery({ queryKey: functionKeys.capabilities(), queryFn: getTranslationCapabilities, staleTime: 5 * 60_000 });

export const usePublicFunctions = (query: FunctionQuery = {}) =>
  useQuery({ queryKey: functionKeys.publicList(query), queryFn: () => getFunctions(query) });

export const usePublicFunction = (id: number) =>
  useQuery({ queryKey: functionKeys.publicDetail(id), queryFn: () => getFunction(id), enabled: Number.isFinite(id) });

export interface FunctionOptions {
  organizations: FunctionOrganization[];
  categories: FunctionCategory[];
}

export function useFunctionOptions() {
  const { user, isSuperAdmin, hasPermission } = useAuth();
  const global = isSuperAdmin || hasPermission('FUNCTIONS_MANAGE_ANY_ORGANIZATION');
  const ownOrganizations = user?.organizations ?? [];
  return useQuery<FunctionOptions>({
    queryKey: functionKeys.options(global, user?.id ?? null),
    queryFn: async () => {
      const [organizations, categories] = await Promise.all([
        global ? getPublicOrganizations() : Promise.resolve<FunctionOrganization[]>(ownOrganizations),
        getFunctionCategories(),
      ]);
      return { organizations, categories };
    },
  });
}

async function storeFunction(client: QueryClient, record: AdminFunction) {
  client.setQueryData(functionKeys.detail(record.id), record);
  await Promise.all([
    client.invalidateQueries({ queryKey: functionKeys.admin() }),
    client.invalidateQueries({ queryKey: [...functionKeys.all, 'public'] }),
    client.invalidateQueries({ queryKey: functionKeys.audit(record.id) }),
  ]);
}

function useFunctionMutation<TVariables>(mutationFn: (variables: TVariables) => Promise<AdminFunction>) {
  const client = useQueryClient();
  return useMutation({ mutationFn, onSuccess: (record) => storeFunction(client, record) });
}

export const useCreateFunction = () => useFunctionMutation((body: CreateFunctionRequest) => createFunction(body));

export const useUpdateFunction = (id: number) => useFunctionMutation((body: UpdateFunctionRequest) => updateFunction(id, body));

export const useTransitionFunction = (id: number) =>
  useFunctionMutation(({ action, reason }: { action: FunctionTransition; reason?: string }) => transitionFunction(id, action, reason));

export const useDeactivateFunction = (id: number) =>
  useFunctionMutation(async () => {
    await deactivateFunction(id);
    return getAdminFunction(id);
  });

export const useSaveFunctionTranslation = (id: number) =>
  useFunctionMutation(({ language, name, description }: { language: string; name: string; description: string }) =>
    saveFunctionTranslation(id, language, { name, description }));

export const useAutoTranslateFunction = (id: number) =>
  useFunctionMutation(({ languages, overwriteMachine }: { languages: string[]; overwriteMachine: boolean }) =>
    translateFunction(id, languages, overwriteMachine));

export const useUpdateFunctionRequirements = (id: number) =>
  useFunctionMutation(async (requirements: string) => {
    await updateFunctionRequirements(id, { requirements });
    return getAdminFunction(id);
  });
