import React, { createContext, useContext, useCallback, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useGlobalState } from '../GlobalStateProvider';
import { useUI } from '../UIProvider';
import { useFileSystem } from '../FileSystemProvider';
import type { Information } from '../../../types';
import { incrementRevision } from '../../../utils/revisionUtils';

interface InformationContextValue {
  // Data
  information: Information[];

  // CRUD operations
  handleAddInformation: (
    info: Omit<Information, 'id' | 'lastModified' | 'dateCreated'>
  ) => Promise<void>;
  handleEditInformation: (info: Information) => void;
  handleUpdateInformation: (id: string, data: Partial<Information>) => Promise<void>;
  handleDeleteInformation: (id: string) => void;
  handleRestoreInformation: (id: string) => void;
  handlePermanentDeleteInformation: (id: string) => void;
}

const InformationContext = createContext<InformationContextValue | undefined>(undefined);

export const InformationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { information, setInformation } = useGlobalState();
  const { setIsInformationModalOpen, setSelectedInformation } = useUI();
  const {
    saveInformation,
    deleteInformation: fsDeleteInformation,
    information: fsInformation,
    isReady,
    getNextId,
  } = useFileSystem();
  const hasSyncedInitial = useRef(false);

  // Sync information from filesystem on initial load
  useEffect(() => {
    if (isReady && fsInformation.length > 0 && !hasSyncedInitial.current) {
      console.log(
        '[InformationProvider] Syncing from filesystem:',
        fsInformation.length,
        'information items'
      );
      setInformation(fsInformation);
      hasSyncedInitial.current = true;
    }
  }, [isReady, fsInformation, setInformation]);

  const handleAddInformation = useCallback(
    async (newInfoData: Omit<Information, 'id' | 'lastModified' | 'dateCreated'>) => {
      const newId = await getNextId('information');
      const now = Date.now();

      const newInfo: Information = {
        ...newInfoData,
        id: newId,
        dateCreated: now,
        lastModified: now,
        revision: '01',
      };

      setInformation((prev) => [...prev, newInfo]);

      try {
        await saveInformation(newInfo);
      } catch (error) {
        console.error('Failed to save information:', error);
      }
    },
    [getNextId, saveInformation, setInformation]
  );

  const handleEditInformation = useCallback(
    (info: Information) => {
      setSelectedInformation(info);
      setIsInformationModalOpen(true);
    },
    [setSelectedInformation, setIsInformationModalOpen]
  );

  const handleUpdateInformation = useCallback(
    async (id: string, updatedData: Partial<Information>) => {
      const existingInfo = information.find((info) => info.id === id);
      if (!existingInfo) return;

      const newRevision = incrementRevision(existingInfo.revision || '01');
      const finalInfo: Information = {
        ...existingInfo,
        ...updatedData,
        revision: newRevision,
        lastModified: Date.now(),
      };

      setInformation((prev) => prev.map((info) => (info.id === id ? finalInfo : info)));
      setIsInformationModalOpen(false);
      setSelectedInformation(null);

      try {
        await saveInformation(finalInfo);
      } catch (error) {
        console.error('Failed to save information:', error);
      }
    },
    [
      information,
      saveInformation,
      setInformation,
      setSelectedInformation,
      setIsInformationModalOpen,
    ]
  );

  const handleDeleteInformation = useCallback(
    (id: string) => {
      const existingInfo = information.find((info) => info.id === id);
      if (!existingInfo) return;

      const deletedInfo: Information = {
        ...existingInfo,
        isDeleted: true,
        deletedAt: Date.now(),
      };

      setInformation((prev) => prev.map((info) => (info.id === id ? deletedInfo : info)));
      setIsInformationModalOpen(false);
      setSelectedInformation(null);

      saveInformation(deletedInfo).catch((err) =>
        console.error('Failed to soft-delete information:', err)
      );
    },
    [
      information,
      saveInformation,
      setInformation,
      setSelectedInformation,
      setIsInformationModalOpen,
    ]
  );

  const handleRestoreInformation = useCallback(
    (id: string) => {
      const existingInfo = information.find((info) => info.id === id);
      if (!existingInfo) return;

      const restoredInfo: Information = {
        ...existingInfo,
        isDeleted: false,
        deletedAt: undefined,
        lastModified: Date.now(),
      };

      setInformation((prev) => prev.map((info) => (info.id === id ? restoredInfo : info)));

      saveInformation(restoredInfo).catch((err) =>
        console.error('Failed to restore information:', err)
      );
    },
    [information, saveInformation, setInformation]
  );

  const handlePermanentDeleteInformation = useCallback(
    (id: string) => {
      setInformation((prev) => prev.filter((info) => info.id !== id));

      fsDeleteInformation(id).catch((err) =>
        console.error('Failed to permanently delete information:', err)
      );
    },
    [fsDeleteInformation, setInformation]
  );

  const value: InformationContextValue = {
    information,
    handleAddInformation,
    handleEditInformation,
    handleUpdateInformation,
    handleDeleteInformation,
    handleRestoreInformation,
    handlePermanentDeleteInformation,
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
