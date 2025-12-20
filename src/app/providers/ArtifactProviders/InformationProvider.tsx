import React, { createContext, useContext, useCallback, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useGlobalState } from '../GlobalStateProvider';
import { useUI } from '../UIProvider';
import { useFileSystem } from '../FileSystemProvider';
import { useUser } from '../UserProvider';
import { useToast } from '../ToastProvider';
import { debug } from '../../../utils/debug';
import type { Information } from '../../../types';
import { useArtifactCRUD } from './useArtifactCRUD';

interface InformationContextValue {
  // Data
  information: Information[];

  // CRUD operations
  handleAddInformation: (
    info: Omit<Information, 'id' | 'lastModified' | 'dateCreated' | 'revision'>
  ) => Promise<Information | null>;
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
  } = useFileSystem();
  const { currentUser } = useUser();
  const { showToast } = useToast();
  const hasSyncedInitial = useRef(false);

  // Sync information from filesystem on initial load
  useEffect(() => {
    if (isReady && fsInformation.length > 0 && !hasSyncedInitial.current) {
      debug.log(
        '[InformationProvider] Syncing from filesystem:',
        fsInformation.length,
        'information items'
      );
      setInformation(fsInformation);
      hasSyncedInitial.current = true;
    }
  }, [isReady, fsInformation, setInformation]);

  const {
    handleAdd: handleAddInternal,
    handleUpdate: handleUpdateInformation,
    handleDelete: handleDeleteInformation,
    handleRestore: handleRestoreInformation,
    handlePermanentDelete: handlePermanentDeleteInformation,
  } = useArtifactCRUD<Information>({
    type: 'information',
    items: information,
    setItems: setInformation,
    saveFn: saveInformation,
    deleteFn: fsDeleteInformation,
    onAfterUpdate: () => {
      setIsInformationModalOpen(false);
      setSelectedInformation(null);
    },
  });

  const handleAddInformation = useCallback(
    (data: Omit<Information, 'id' | 'lastModified' | 'dateCreated' | 'revision'>) => {
      const fullData = {
        ...data,
        dateCreated: Date.now(),
      } as Omit<Information, 'id' | 'lastModified' | 'revision'>;
      return handleAddInternal(fullData);
    },
    [handleAddInternal]
  );

  const handleEditInformation = useCallback(
    (info: Information) => {
      if (!currentUser) {
        showToast(
          'Please select a user before editing artifacts. Go to Settings → Users to select a user.',
          'warning'
        );
        return;
      }
      setSelectedInformation(info);
      setIsInformationModalOpen(true);
    },
    [currentUser, setSelectedInformation, setIsInformationModalOpen, showToast]
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
