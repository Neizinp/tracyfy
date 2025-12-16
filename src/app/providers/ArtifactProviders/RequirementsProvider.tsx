import React, { createContext, useContext, useCallback, useEffect, useRef } from 'react';
import { debug } from '../../../utils/debug';
import type { ReactNode } from 'react';
import { useGlobalState } from '../GlobalStateProvider';
import { useUI } from '../UIProvider';
import { useFileSystem } from '../FileSystemProvider';
import { useUser } from '../UserProvider';
import { useToast } from '../ToastProvider';
import type { Requirement } from '../../../types';
import { incrementRevision } from '../../../utils/revisionUtils';

interface RequirementsContextValue {
  // Data
  requirements: Requirement[];
  setRequirements: (reqs: Requirement[] | ((prev: Requirement[]) => Requirement[])) => void;

  // CRUD operations
  handleAddRequirement: (req: Omit<Requirement, 'id' | 'lastModified'>) => Promise<void>;
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
    getNextId,
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

  const handleAddRequirement = useCallback(
    async (newReqData: Omit<Requirement, 'id' | 'lastModified'>) => {
      if (!currentUser) {
        showToast(
          'Please select a user before creating artifacts. Go to Settings → Users to select a user.',
          'warning'
        );
        return;
      }

      const newId = await getNextId('requirements');

      const newRequirement: Requirement = {
        ...newReqData,
        id: newId,
        lastModified: Date.now(),
        revision: '01',
      };

      setRequirements((prev) => [...prev, newRequirement]);

      try {
        await saveRequirement(newRequirement);
      } catch (error) {
        console.error('Failed to save requirement:', error);
      }
    },
    [currentUser, getNextId, saveRequirement, setRequirements, showToast]
  );

  const handleUpdateRequirement = useCallback(
    async (id: string, updatedData: Partial<Requirement>) => {
      const existingReq = requirements.find((req) => req.id === id);
      if (!existingReq) return;

      const newRevision = incrementRevision(existingReq.revision || '01');
      const finalRequirement: Requirement = {
        ...existingReq,
        ...updatedData,
        revision: newRevision,
        lastModified: Date.now(),
      };

      setRequirements((prev) => prev.map((r) => (r.id === id ? finalRequirement : r)));
      setIsEditRequirementModalOpen(false);
      setEditingRequirement(null);

      try {
        await saveRequirement(finalRequirement);
      } catch (error) {
        console.error('Failed to save requirement:', error);
      }
    },
    [
      requirements,
      saveRequirement,
      setRequirements,
      setEditingRequirement,
      setIsEditRequirementModalOpen,
    ]
  );

  const handleDeleteRequirement = useCallback(
    (id: string) => {
      const existingReq = requirements.find((req) => req.id === id);
      if (!existingReq) return;

      const deletedReq: Requirement = {
        ...existingReq,
        isDeleted: true,
        deletedAt: Date.now(),
      };

      setRequirements((prev) => prev.map((req) => (req.id === id ? deletedReq : req)));
      setIsEditRequirementModalOpen(false);
      setEditingRequirement(null);

      saveRequirement(deletedReq).catch((err) =>
        console.error('Failed to soft-delete requirement:', err)
      );
    },
    [
      requirements,
      saveRequirement,
      setRequirements,
      setEditingRequirement,
      setIsEditRequirementModalOpen,
    ]
  );

  const handleRestoreRequirement = useCallback(
    (id: string) => {
      const existingReq = requirements.find((req) => req.id === id);
      if (!existingReq) return;

      const restoredReq: Requirement = {
        ...existingReq,
        isDeleted: false,
        deletedAt: undefined,
        lastModified: Date.now(),
      };

      setRequirements((prev) => prev.map((req) => (req.id === id ? restoredReq : req)));

      saveRequirement(restoredReq).catch((err) =>
        console.error('Failed to restore requirement:', err)
      );
    },
    [requirements, saveRequirement, setRequirements]
  );

  const handlePermanentDeleteRequirement = useCallback(
    (id: string) => {
      setRequirements((prev) => prev.filter((req) => req.id !== id));

      fsDeleteRequirement(id).catch((err) =>
        console.error('Failed to permanently delete requirement:', err)
      );
    },
    [fsDeleteRequirement, setRequirements]
  );

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
