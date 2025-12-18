import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { diskCustomAttributeService } from '../../services/diskCustomAttributeService';
import type {
  CustomAttributeDefinition,
  ApplicableArtifactType,
} from '../../types/customAttributes';
import { useFileSystem } from './FileSystemProvider';

interface CustomAttributeContextType {
  definitions: CustomAttributeDefinition[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  getDefinitionsForType: (type: ApplicableArtifactType) => CustomAttributeDefinition[];
}

const CustomAttributeContext = createContext<CustomAttributeContextType | undefined>(undefined);

export const CustomAttributeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isReady } = useFileSystem();
  const [definitions, setDefinitions] = useState<CustomAttributeDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchDefinitions = useCallback(async () => {
    if (!isReady) {
      // File system not ready yet, stay in loading state
      setLoading(true);
      return;
    }
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
  }, [isReady]);

  useEffect(() => {
    fetchDefinitions();
  }, [fetchDefinitions]);

  const getDefinitionsForType = useCallback(
    (type: ApplicableArtifactType): CustomAttributeDefinition[] => {
      return definitions.filter((def) => def.appliesTo.includes(type));
    },
    [definitions]
  );

  return (
    <CustomAttributeContext.Provider
      value={{
        definitions,
        loading,
        error,
        refetch: fetchDefinitions,
        getDefinitionsForType,
      }}
    >
      {children}
    </CustomAttributeContext.Provider>
  );
};

export const useCustomAttributeContext = () => {
  const context = useContext(CustomAttributeContext);
  if (context === undefined) {
    throw new Error('useCustomAttributeContext must be used within a CustomAttributeProvider');
  }
  return context;
};
