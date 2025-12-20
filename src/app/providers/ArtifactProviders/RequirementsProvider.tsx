import React, { createContext, useContext, useCallback, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useGlobalState } from '../GlobalStateProvider';
import { useUI } from '../UIProvider';
import { useFileSystem } from '../FileSystemProvider';
import { useUser } from '../UserProvider';
import { useToast } from '../ToastProvider';
import { debug } from '../../../utils/debug';
import type { Requirement } from '../../../types';
import { useArtifactCRUD } from './useArtifactCRUD';

interface RequirementsContextValue {
  // Data
  requirements: Requirement[];
  setRequirements: (reqs: Requirement[] | ((prev: Requirement[]) => Requirement[])) => void;

  // CRUD operations
  handleAddRequirement: (
    req: Omit<Requirement, 'id' | 'lastModified'>
  ) => Promise<Requirement | null>;
  handleUpdateRequirement: (id: string, data: Partial<Requirement>) => Promise<void>;
  handleDeleteRequirement: (id: string) => void;
  handleRestoreRequirement: (id: string) => void;
  handlePermanentDeleteRequirement: (id: string) => void;

  // Page handlers
  handleEdit: (req: Requirement) => void;
  handleLink: (sourceId: string) => void;
}

const RequirementsContext = createContext<RequirementsContextValue | undefined>(undefined);

export const RequirementsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const globalState = useGlobalState();
  const { requirements, setRequirements } = globalState;
  const {
    setEditingRequirement,
    setIsEditRequirementModalOpen,
    setLinkSourceId,
    setIsLinkModalOpen,
  } = useUI();
  const {
    saveRequirement,
    deleteRequirement: fsDeleteRequirement,
    requirements: fsRequirements,
    isReady,
  } = useFileSystem();
  const { currentUser } = useUser();
  const { showToast } = useToast();
  const hasSyncedInitial = useRef(false);

  // Sync requirements from filesystem on initial load
  useEffect(() => {
    if (isReady && fsRequirements.length > 0 && !hasSyncedInitial.current) {
      debug.log(
        '[RequirementsProvider] Syncing from filesystem:',
        fsRequirements.length,
        'requirements'
      );
      setRequirements(fsRequirements);
      hasSyncedInitial.current = true;
    }
  }, [isReady, fsRequirements, setRequirements]);

  const {
    handleAdd: handleAddRequirement,
    handleUpdate: handleUpdateRequirement,
    handleDelete: handleDeleteRequirement,
    handleRestore: handleRestoreRequirement,
    handlePermanentDelete: handlePermanentDeleteRequirement,
  } = useArtifactCRUD<Requirement>({
    type: 'requirements',
    items: requirements,
    setItems: setRequirements,
    saveFn: saveRequirement,
    deleteFn: fsDeleteRequirement,
    onAfterUpdate: () => {
      setIsEditRequirementModalOpen(false);
      setEditingRequirement(null);
    },
  });

  const handleEdit = useCallback(
    (req: Requirement) => {
      if (!currentUser) {
        showToast(
          'Please select a user before editing artifacts. Go to Settings → Users to select a user.',
          'warning'
        );
        return;
      }
      setEditingRequirement(req);
      setIsEditRequirementModalOpen(true);
    },
    [currentUser, setEditingRequirement, setIsEditRequirementModalOpen, showToast]
  );

  const handleLink = useCallback(
    (sourceId: string) => {
      setLinkSourceId(sourceId);
      setIsLinkModalOpen(true);
    },
    [setLinkSourceId, setIsLinkModalOpen]
  );

  const value: RequirementsContextValue = {
    requirements,
    setRequirements,
    handleAddRequirement,
    handleUpdateRequirement,
    handleDeleteRequirement,
    handleRestoreRequirement,
    handlePermanentDeleteRequirement,
    handleEdit,
    handleLink,
  };

  return <RequirementsContext.Provider value={value}>{children}</RequirementsContext.Provider>;
};

export const useRequirements = (): RequirementsContextValue => {
  const context = useContext(RequirementsContext);
  if (context === undefined) {
    throw new Error('useRequirements must be used within a RequirementsProvider');
  }
  return context;
};
