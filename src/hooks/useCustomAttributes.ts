import { useCustomAttributeContext } from '../app/providers/CustomAttributeProvider';
import type { CustomAttributeDefinition, ApplicableArtifactType } from '../types/customAttributes';

interface UseCustomAttributesResult {
  definitions: CustomAttributeDefinition[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  getDefinitionsForType: (type: ApplicableArtifactType) => CustomAttributeDefinition[];
}

/**
 * Hook to access custom attribute definitions.
 * Now uses centralized CustomAttributeProvider for efficient, consistent state.
 */
export const useCustomAttributes = (): UseCustomAttributesResult => {
  const context = useCustomAttributeContext();

  return {
    definitions: context.definitions,
    loading: context.loading,
    error: context.error,
    refetch: context.refetch,
    getDefinitionsForType: context.getDefinitionsForType,
  };
};
