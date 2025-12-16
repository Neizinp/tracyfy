import { useState, useEffect, useCallback } from 'react';
import { diskCustomAttributeService } from '../services/diskCustomAttributeService';
import type { CustomAttributeDefinition, ApplicableArtifactType } from '../types/customAttributes';

interface UseCustomAttributesResult {
  definitions: CustomAttributeDefinition[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  getDefinitionsForType: (type: ApplicableArtifactType) => CustomAttributeDefinition[];
}

/**
 * Hook to access custom attribute definitions
 */
export const useCustomAttributes = (): UseCustomAttributesResult => {
  const [definitions, setDefinitions] = useState<CustomAttributeDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchDefinitions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const defs = await diskCustomAttributeService.getAllDefinitions();
      setDefinitions(defs);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch custom attributes'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDefinitions();
  }, [fetchDefinitions]);

  const getDefinitionsForType = useCallback(
    (type: ApplicableArtifactType): CustomAttributeDefinition[] => {
      return definitions.filter((def) => def.appliesTo.includes(type));
    },
    [definitions]
  );

  return {
    definitions,
    loading,
    error,
    refetch: fetchDefinitions,
    getDefinitionsForType,
  };
};
