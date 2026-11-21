import { useCallback } from 'react';
import { useAppStore } from '../state';
import type { CustomAttributeDefinition, ApplicableArtifactType } from '../types/customAttributes';

interface UseCustomAttributesResult {
  definitions: CustomAttributeDefinition[];
  /** True until a folder is open and its definitions are loaded */
  loading: boolean;
  /** Read the definitions from tracyfy.yaml again */
  refetch: () => Promise<void>;
  getDefinitionsForType: (type: ApplicableArtifactType) => CustomAttributeDefinition[];
}

/** The custom attribute definitions of the project (from tracyfy.yaml) */
export const useCustomAttributes = (): UseCustomAttributesResult => {
  const definitions = useAppStore((s) => s.attributeDefinitions);
  const loading = useAppStore((s) => !s.isReady);
  const refetch = useAppStore((s) => s.reloadConfig);

  const getDefinitionsForType = useCallback(
    (type: ApplicableArtifactType) => definitions.filter((def) => def.appliesTo.includes(type)),
    [definitions]
  );

  return { definitions, loading, refetch, getDefinitionsForType };
};
