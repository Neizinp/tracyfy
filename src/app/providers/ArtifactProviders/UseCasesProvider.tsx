import React from 'react';
import type { ReactNode } from 'react';
import type { UseCase } from '../../../types';
import { createArtifactProvider } from './BaseArtifactProvider';

interface UseCasesContextValue {
  useCases: UseCase[];
  handleAddUseCase: (
    uc: Omit<UseCase, 'id' | 'lastModified' | 'dateCreated' | 'revision'>
  ) => Promise<UseCase | null>;
  handleUpdateUseCase: (id: string, data: Partial<UseCase>) => Promise<void>;
  handleDeleteUseCase: (id: string) => void;
  handleRestoreUseCase: (id: string) => void;
  handlePermanentDeleteUseCase: (id: string) => void;
  handleEditUseCase: (uc: UseCase) => void;
  handleLink: (sourceId: string) => void;
}

const { Provider: BaseProvider, useProviderContext } = createArtifactProvider<UseCase>({
  type: 'useCases',
  displayName: 'UseCases',
  useData: (state) => ({
    items: state.useCases,
    setItems: state.setUseCases,
  }),
  useFS: (fs) => ({
    save: fs.saveUseCase,
    delete: fs.deleteUseCase,
    fsItems: fs.useCases,
    isReady: fs.isReady,
  }),
  useUIHelpers: (ui) => ({
    setEditingItem: ui.setEditingUseCase,
    setIsModalOpen: ui.setIsUseCaseModalOpen,
    setLinkSourceId: ui.setLinkSourceId,
    setIsLinkModalOpen: ui.setIsLinkModalOpen,
  }),
});

export const UseCasesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return <BaseProvider>{children}</BaseProvider>;
};

export const useUseCases = (): UseCasesContextValue => {
  const context = useProviderContext();

  return {
    useCases: context.items,
    handleAddUseCase: (data) => context.handleAdd({ ...data, dateCreated: Date.now() }),
    handleUpdateUseCase: context.handleUpdate,
    handleDeleteUseCase: context.handleDelete,
    handleRestoreUseCase: context.handleRestore,
    handlePermanentDeleteUseCase: context.handlePermanentDelete,
    handleEditUseCase: context.handleEdit,
    handleLink: context.handleLink!,
  };
};
