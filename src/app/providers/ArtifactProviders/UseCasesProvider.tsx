import React, { createContext, useContext, useCallback, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useUseCases as useUseCasesHook } from '../../../hooks/useUseCases';
import { useGlobalState } from '../GlobalStateProvider';

import { useUI } from '../UIProvider';
import { useFileSystem } from '../FileSystemProvider';
import type { UseCase } from '../../../types';

interface UseCasesContextValue {
  // Data
  useCases: UseCase[];

  // CRUD operations
  handleAddUseCase: (uc: Omit<UseCase, 'id' | 'lastModified'> | any) => void;
  handleEditUseCase: (uc: UseCase) => void;
  handleDeleteUseCase: (id: string) => void;
  handleRestoreUseCase: (id: string) => void;
  handlePermanentDeleteUseCase: (id: string) => void;

  // Page handlers
  handleBreakDownUseCase: (uc: UseCase) => void;
}

const UseCasesContext = createContext<UseCasesContextValue | undefined>(undefined);

export const UseCasesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { useCases, setUseCases, usedUcNumbers, setUsedUcNumbers, requirements, setRequirements } =
    useGlobalState();
  const { setIsUseCaseModalOpen, setEditingUseCase, setIsNewRequirementModalOpen } = useUI();
  const { saveArtifact, deleteArtifact, loadedData, isReady } = useFileSystem();
  const hasSyncedInitial = useRef(false);

  // Sync loaded data from filesystem
  useEffect(() => {
    if (isReady && loadedData && loadedData.useCases) {
      setUseCases(loadedData.useCases);

      // Update used numbers
      const used = new Set<number>();
      loadedData.useCases.forEach((uc) => {
        const match = uc.id.match(/-(\d+)$/);
        if (match) {
          used.add(parseInt(match[1], 10));
        }
      });
      setUsedUcNumbers(used);
    }
  }, [isReady, loadedData, setUseCases, setUsedUcNumbers]);

  // Sync in-memory data to filesystem if filesystem is empty (on initial load)
  useEffect(() => {
    const syncInitial = async () => {
      if (!isReady || !loadedData || hasSyncedInitial.current) return;

      // If filesystem loaded no use cases but we have them in memory,
      // write them to disk (happens when filesystem is empty but localStorage has demo data)
      if (loadedData.useCases.length === 0 && useCases.length > 0) {
        hasSyncedInitial.current = true;
        for (const uc of useCases) {
          try {
            await saveArtifact('usecases', uc.id, uc);
          } catch (error) {
            console.error('Failed to sync use case to filesystem:', error);
          }
        }
      }
    };

    syncInitial();
  }, [isReady, loadedData, useCases, saveArtifact]);

  const useCasesHook = useUseCasesHook({
    useCases,
    setUseCases,
    usedUcNumbers,
    setUsedUcNumbers,
    requirements,
    setRequirements,
    setIsUseCaseModalOpen,
    setEditingUseCase,
    saveArtifact,
    deleteArtifact,
  });

  const handleBreakDownUseCase = useCallback(
    (_uc: UseCase) => {
      // Pre-fill a new requirement based on the use case
      setEditingUseCase(null);
      setIsNewRequirementModalOpen(true);
      // The modal will need to detect this scenario - for now just open the modal
    },
    [setEditingUseCase, setIsNewRequirementModalOpen]
  );

  const value: UseCasesContextValue = {
    useCases,
    ...useCasesHook,
    handleBreakDownUseCase,
  };

  return <UseCasesContext.Provider value={value}>{children}</UseCasesContext.Provider>;
};

export const useUseCases = (): UseCasesContextValue => {
  const context = useContext(UseCasesContext);
  if (context === undefined) {
    throw new Error('useUseCases must be used within a UseCasesProvider');
  }
  return context;
};
