import { useAuth } from '../contexts/auth';
import { useAsync } from './useAsync';
import { getPublicOrganizations } from '../services/organizationService';
import { getFunctionCategories } from '../services/adminFunctionService';
import type { FunctionOrganization } from '../types/adminFunctions';

export function useFunctionOptions() {
  const { user, isSuperAdmin, hasPermission } = useAuth();
  const global = isSuperAdmin || hasPermission('FUNCTIONS_MANAGE_ANY_ORGANIZATION');
  return useAsync(async () => {
    const [organizations, categories] = await Promise.all([
      global ? getPublicOrganizations() : Promise.resolve<FunctionOrganization[]>(user?.organizations ?? []),
      getFunctionCategories(),
    ]);
    return { organizations, categories };
  }, [global, user]);
}
