import React, { createContext, useContext, useCallback, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useGlobalState } from '../GlobalStateProvider';
import { useUI } from '../UIProvider';
import { useFileSystem } from '../FileSystemProvider';
import { useUser } from '../UserProvider';
import { useToast } from '../ToastProvider';
import { debug } from '../../../utils/debug';
import type { UseCase } from '../../../types';
import { useArtifactCRUD } from './useArtifactCRUD';

interface UseCasesContextValue {
  // Data
  useCases: UseCase[];

  // CRUD operations
  handleAddUseCase: (
    uc: Omit<UseCase, 'id' | 'lastModified' | 'revision'>
  ) => Promise<UseCase | null>;
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
  } = useFileSystem();
  const { currentUser } = useUser();
  const { showToast } = useToast();
  const hasSyncedInitial = useRef(false);

  // Sync use cases from filesystem on initial load
  useEffect(() => {
    if (isReady && fsUseCases.length > 0 && !hasSyncedInitial.current) {
      debug.log('[UseCasesProvider] Syncing from filesystem:', fsUseCases.length, 'use cases');
      setUseCases(fsUseCases);
      hasSyncedInitial.current = true;
    }
  }, [isReady, fsUseCases, setUseCases]);

  const {
    handleAdd: handleAddUseCase,
    handleUpdate: handleUpdateUseCase,
    handleDelete: handleDeleteUseCase,
    handleRestore: handleRestoreUseCase,
    handlePermanentDelete: handlePermanentDeleteUseCase,
  } = useArtifactCRUD<UseCase>({
    type: 'useCases',
    items: useCases,
    setItems: setUseCases,
    saveFn: saveUseCase,
    deleteFn: fsDeleteUseCase,
    onAfterUpdate: () => {
      setIsUseCaseModalOpen(false);
      setEditingUseCase(null);
    },
  });

  const handleBreakDownUseCase = useCallback(
    (_uc: UseCase) => {
      setEditingUseCase(null);
      setIsNewRequirementModalOpen(true);
    },
    [setEditingUseCase, setIsNewRequirementModalOpen]
  );

  const handleEditUseCase = useCallback(
    (uc: UseCase) => {
      if (!currentUser) {
        showToast(
          'Please select a user before editing artifacts. Go to Settings → Users to select a user.',
          'warning'
        );
        return;
      }
      setEditingUseCase(uc);
      setIsUseCaseModalOpen(true);
    },
    [currentUser, setEditingUseCase, setIsUseCaseModalOpen, showToast]
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
