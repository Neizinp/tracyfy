import React, { createContext, useContext, useCallback, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useRequirements as useRequirementsHook } from '../../../hooks/useRequirements';
import { useGlobalState } from '../GlobalStateProvider';

import { useUI } from '../UIProvider';
import { useFileSystem } from '../FileSystemProvider';
import type { Requirement, Link } from '../../../types';

interface RequirementsContextValue {
  // Data
  requirements: Requirement[];
  setRequirements: (reqs: Requirement[] | ((prev: Requirement[]) => Requirement[])) => void;
  links: Link[];
  setLinks: (links: Link[] | ((prev: Link[]) => Link[])) => void;

  // CRUD operations
  handleAddRequirement: (req: Omit<Requirement, 'id' | 'lastModified'>) => Promise<void>;
  handleUpdateRequirement: (id: string, data: Partial<Requirement>) => Promise<void>;
  handleDeleteRequirement: (id: string) => void;
  handleRestoreRequirement: (id: string) => void;
  handlePermanentDeleteRequirement: (id: string) => void;

  // Page handlers
  handleEdit: (req: Requirement) => void;
  handleLink: (sourceId: string) => void;
  handleAddLink: (linkData: Omit<Link, 'id'>) => void;
}

const RequirementsContext = createContext<RequirementsContextValue | undefined>(undefined);

export const RequirementsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { requirements, setRequirements, links, setLinks, usedReqNumbers, setUsedReqNumbers } =
    useGlobalState();
  const {
    setEditingRequirement,
    setIsEditRequirementModalOpen,
    setLinkSourceId,
    setIsLinkModalOpen,
    setSelectedRequirementId,
  } = useUI();
  const { saveArtifact, deleteArtifact, loadedData, isReady } = useFileSystem();
  const hasSyncedInitial = useRef(false);

  // Sync loaded data from filesystem
  useEffect(() => {
    if (isReady && loadedData && loadedData.requirements) {
      setRequirements(loadedData.requirements);

      // Update used numbers
      const used = new Set<number>();
      loadedData.requirements.forEach((req) => {
        const match = req.id.match(/-(\d+)$/);
        if (match) {
          used.add(parseInt(match[1], 10));
        }
      });
      setUsedReqNumbers(used);
    }
  }, [isReady, loadedData, setRequirements, setUsedReqNumbers]);

  // Sync in-memory data to filesystem if filesystem is empty (on initial load)
  useEffect(() => {
    const syncInitial = async () => {
      if (!isReady || !loadedData || hasSyncedInitial.current) return;
      if (loadedData.requirements.length === 0 && requirements.length > 0) {
        console.log(
          '[SYNC] Writing requirements to filesystem:',
          requirements.map((r) => r.id)
        );
        hasSyncedInitial.current = true;
        for (const req of requirements) {
          try {
            await saveArtifact('requirements', req.id, req);
            console.log(`[SYNC] Saved requirement ${req.id} to filesystem.`);
          } catch (error) {
            console.error('Failed to sync requirement to filesystem:', error);
          }
        }
      }
    };
    syncInitial();
  }, [isReady, loadedData, requirements, saveArtifact]);

  const requirementsHook = useRequirementsHook({
    requirements,
    setRequirements,
    usedReqNumbers,
    setUsedReqNumbers,
    setLinks,
    setIsEditModalOpen: setIsEditRequirementModalOpen,
    setEditingRequirement,
    saveArtifact,
    deleteArtifact,
  });

  const handleEdit = useCallback(
    (req: Requirement) => {
      setEditingRequirement(req);
      setIsEditRequirementModalOpen(true);
    },
    [setEditingRequirement, setIsEditRequirementModalOpen]
  );

  const handleLink = useCallback(
    (sourceId: string) => {
      setLinkSourceId(sourceId);
      setIsLinkModalOpen(true);
    },
    [setLinkSourceId, setIsLinkModalOpen]
  );

  const handleAddLink = useCallback(
    (linkData: Omit<Link, 'id'>) => {
      const newLink: Link = {
        ...linkData,
        id: `LINK-${Date.now()}`,
      };
      setLinks((prev) => [...prev, newLink]);
      setIsLinkModalOpen(false);
      setSelectedRequirementId(null);
    },
    [setLinks, setIsLinkModalOpen, setSelectedRequirementId]
  );

  const value: RequirementsContextValue = {
    requirements,
    setRequirements,
    links,
    setLinks,
    ...requirementsHook,
    handleEdit,
    handleLink,
    handleAddLink,
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
