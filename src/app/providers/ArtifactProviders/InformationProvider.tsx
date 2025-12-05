import React, { createContext, useContext, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useInformation as useInformationHook } from '../../../hooks/useInformation';
import { useGlobalState } from '../GlobalStateProvider';

import { useUI } from '../UIProvider';
import { useFileSystem } from '../FileSystemProvider';
import type { Information } from '../../../types';

interface InformationContextValue {
  // Data
  information: Information[];

  // CRUD operations
  handleAddInformation: (
    info: Omit<Information, 'id' | 'lastModified' | 'dateCreated'> | any
  ) => void;
  handleEditInformation: (info: Information) => void;
  handleDeleteInformation: (id: string) => void;
  handleRestoreInformation: (id: string) => void;
  handlePermanentDeleteInformation: (id: string) => void;
}

const InformationContext = createContext<InformationContextValue | undefined>(undefined);

export const InformationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { information, setInformation, usedInfoNumbers, setUsedInfoNumbers } = useGlobalState();
  const { setIsInformationModalOpen, setSelectedInformation } = useUI();
  const { saveArtifact, deleteArtifact, loadedData, isReady } = useFileSystem();
  const hasSyncedInitial = useRef(false);

  // Sync loaded data from filesystem
  useEffect(() => {
    if (isReady && loadedData && loadedData.information) {
      setInformation(loadedData.information);

      // Update used numbers
      const used = new Set<number>();
      loadedData.information.forEach((info) => {
        const match = info.id.match(/-(\d+)$/);
        if (match) {
          used.add(parseInt(match[1], 10));
        }
      });
      setUsedInfoNumbers(used);
    }
  }, [isReady, loadedData, setInformation, setUsedInfoNumbers]);

  // Sync in-memory data to filesystem if filesystem is empty (on initial load)
  useEffect(() => {
    const syncInitial = async () => {
      if (!isReady || !loadedData || hasSyncedInitial.current) return;

      // If filesystem loaded no information but we have it in memory,
      // write it to disk (happens when filesystem is empty but localStorage has demo data)
      if (loadedData.information.length === 0 && information.length > 0) {
        hasSyncedInitial.current = true;
        for (const info of information) {
          try {
            await saveArtifact('information', info.id, info);
          } catch (error) {
            console.error('Failed to sync information to filesystem:', error);
          }
        }
      }
    };

    syncInitial();
  }, [isReady, loadedData, information, saveArtifact]);

  const informationHook = useInformationHook({
    information,
    setInformation,
    usedInfoNumbers,
    setUsedInfoNumbers,
    setIsInformationModalOpen,
    setSelectedInformation,
    saveArtifact,
    deleteArtifact,
  });

  const value: InformationContextValue = {
    information,
    ...informationHook,
  };

  return <InformationContext.Provider value={value}>{children}</InformationContext.Provider>;
};

export const useInformation = (): InformationContextValue => {
  const context = useContext(InformationContext);
  if (context === undefined) {
    throw new Error('useInformation must be used within an InformationProvider');
  }
  return context;
};
