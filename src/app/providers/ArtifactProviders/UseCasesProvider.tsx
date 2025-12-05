import React, { createContext, useContext, useCallback, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useGlobalState } from '../GlobalStateProvider';
import { useUI } from '../UIProvider';
import { useFileSystem } from '../FileSystemProvider';
import type { UseCase } from '../../../types';
import { incrementRevision } from '../../../utils/revisionUtils';

interface UseCasesContextValue {
  // Data
  useCases: UseCase[];

  // CRUD operations
  handleAddUseCase: (uc: Omit<UseCase, 'id' | 'lastModified'> | any) => Promise<void>;
  handleEditUseCase: (uc: UseCase) => void;
  handleUpdateUseCase: (id: string, data: Partial<UseCase>) => Promise<void>;
  handleDeleteUseCase: (id: string) => void;
  handleRestoreUseCase: (id: string) => void;
  handlePermanentDeleteUseCase: (id: string) => void;

  // Page handlers
  handleBreakDownUseCase: (uc: UseCase) => void;
}

const UseCasesContext = createContext<UseCasesContextValue | undefined>(undefined);

export const UseCasesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { useCases, setUseCases } = useGlobalState();
  const { setIsUseCaseModalOpen, setEditingUseCase, setIsNewRequirementModalOpen } = useUI();
  const {
    saveUseCase,
    deleteUseCase: fsDeleteUseCase,
    useCases: fsUseCases,
    isReady,
    getNextId,
  } = useFileSystem();
  const hasSyncedInitial = useRef(false);

  // Sync use cases from filesystem on initial load
  useEffect(() => {
    if (isReady && fsUseCases.length > 0 && !hasSyncedInitial.current) {
      console.log('[UseCasesProvider] Syncing from filesystem:', fsUseCases.length, 'use cases');
      setUseCases(fsUseCases);
      hasSyncedInitial.current = true;
    }
  }, [isReady, fsUseCases, setUseCases]);

  const handleAddUseCase = useCallback(
    async (newUcData: Omit<UseCase, 'id' | 'lastModified'>) => {
      const newId = await getNextId('useCases');

      const newUseCase: UseCase = {
        ...newUcData,
        id: newId,
        lastModified: Date.now(),
        revision: '01',
      };

      setUseCases((prev) => [...prev, newUseCase]);

      try {
        await saveUseCase(newUseCase);
      } catch (error) {
        console.error('Failed to save use case:', error);
      }
    },
    [getNextId, saveUseCase, setUseCases]
  );

  const handleEditUseCase = useCallback(
    (uc: UseCase) => {
      setEditingUseCase(uc);
      setIsUseCaseModalOpen(true);
    },
    [setEditingUseCase, setIsUseCaseModalOpen]
  );

  const handleUpdateUseCase = useCallback(
    async (id: string, updatedData: Partial<UseCase>) => {
      const existingUc = useCases.find((uc) => uc.id === id);
      if (!existingUc) return;

      const newRevision = incrementRevision(existingUc.revision || '01');
      const finalUseCase: UseCase = {
        ...existingUc,
        ...updatedData,
        revision: newRevision,
        lastModified: Date.now(),
      };

      setUseCases((prev) => prev.map((uc) => (uc.id === id ? finalUseCase : uc)));
      setIsUseCaseModalOpen(false);
      setEditingUseCase(null);

      try {
        await saveUseCase(finalUseCase);
      } catch (error) {
        console.error('Failed to save use case:', error);
      }
    },
    [useCases, saveUseCase, setUseCases, setEditingUseCase, setIsUseCaseModalOpen]
  );

  const handleDeleteUseCase = useCallback(
    (id: string) => {
      const existingUc = useCases.find((uc) => uc.id === id);
      if (!existingUc) return;

      const deletedUc: UseCase = {
        ...existingUc,
        isDeleted: true,
        deletedAt: Date.now(),
      };

      setUseCases((prev) => prev.map((uc) => (uc.id === id ? deletedUc : uc)));
      setIsUseCaseModalOpen(false);
      setEditingUseCase(null);

      saveUseCase(deletedUc).catch((err) => console.error('Failed to soft-delete use case:', err));
    },
    [useCases, saveUseCase, setUseCases, setEditingUseCase, setIsUseCaseModalOpen]
  );

  const handleRestoreUseCase = useCallback(
    (id: string) => {
      const existingUc = useCases.find((uc) => uc.id === id);
      if (!existingUc) return;

      const restoredUc: UseCase = {
        ...existingUc,
        isDeleted: false,
        deletedAt: undefined,
        lastModified: Date.now(),
      };

      setUseCases((prev) => prev.map((uc) => (uc.id === id ? restoredUc : uc)));

      saveUseCase(restoredUc).catch((err) => console.error('Failed to restore use case:', err));
    },
    [useCases, saveUseCase, setUseCases]
  );

  const handlePermanentDeleteUseCase = useCallback(
    (id: string) => {
      setUseCases((prev) => prev.filter((uc) => uc.id !== id));

      fsDeleteUseCase(id).catch((err) =>
        console.error('Failed to permanently delete use case:', err)
      );
    },
    [fsDeleteUseCase, setUseCases]
  );

  const handleBreakDownUseCase = useCallback(
    (_uc: UseCase) => {
      setEditingUseCase(null);
      setIsNewRequirementModalOpen(true);
    },
    [setEditingUseCase, setIsNewRequirementModalOpen]
  );

  const value: UseCasesContextValue = {
    useCases,
    handleAddUseCase,
    handleEditUseCase,
    handleUpdateUseCase,
    handleDeleteUseCase,
    handleRestoreUseCase,
    handlePermanentDeleteUseCase,
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
