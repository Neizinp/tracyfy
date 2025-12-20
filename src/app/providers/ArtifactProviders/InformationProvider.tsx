import React from 'react';
import type { ReactNode } from 'react';
import type { Information } from '../../../types';
import { createArtifactProvider } from './BaseArtifactProvider';

interface InformationContextValue {
  information: Information[];
  handleAddInformation: (
    info: Omit<Information, 'id' | 'lastModified' | 'dateCreated' | 'revision'>
  ) => Promise<Information | null>;
  handleEditInformation: (info: Information) => void;
  handleUpdateInformation: (id: string, data: Partial<Information>) => Promise<void>;
  handleDeleteInformation: (id: string) => void;
  handleRestoreInformation: (id: string) => void;
  handlePermanentDeleteInformation: (id: string) => void;
}

const { Provider: BaseProvider, useProviderContext } = createArtifactProvider<Information>({
  type: 'information',
  displayName: 'Information',
  useData: (state) => ({
    items: state.information,
    setItems: state.setInformation,
  }),
  useFS: (fs) => ({
    save: fs.saveInformation,
    delete: fs.deleteInformation,
    fsItems: fs.information,
    isReady: fs.isReady,
  }),
  useUIHelpers: (ui) => ({
    setEditingItem: ui.setSelectedInformation,
    setIsModalOpen: ui.setIsInformationModalOpen,
  }),
});

export const InformationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return <BaseProvider>{children}</BaseProvider>;
};

export const useInformation = (): InformationContextValue => {
  const context = useProviderContext();

  return {
    information: context.items,
    handleAddInformation: (data) => context.handleAdd({ ...data, dateCreated: Date.now() }),
    handleEditInformation: context.handleEdit,
    handleUpdateInformation: context.handleUpdate,
    handleDeleteInformation: context.handleDelete,
    handleRestoreInformation: context.handleRestore,
    handlePermanentDeleteInformation: context.handlePermanentDelete,
  };
};
