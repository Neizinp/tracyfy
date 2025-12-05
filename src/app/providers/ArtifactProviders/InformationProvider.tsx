import React, { createContext, useContext, useEffect } from 'react';
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
