import React from 'react';
import type { ReactNode } from 'react';
import type { Requirement } from '../../../types';
import { createArtifactProvider } from './BaseArtifactProvider';

// Define the interface to match existing usage
interface RequirementsContextValue {
  requirements: Requirement[];
  setRequirements: (reqs: Requirement[] | ((prev: Requirement[]) => Requirement[])) => void;
  handleAddRequirement: (
    req: Omit<Requirement, 'id' | 'lastModified'>
  ) => Promise<Requirement | null>;
  handleUpdateRequirement: (id: string, data: Partial<Requirement>) => Promise<void>;
  handleDeleteRequirement: (id: string) => void;
  handleRestoreRequirement: (id: string) => void;
  handlePermanentDeleteRequirement: (id: string) => void;
  handleEdit: (req: Requirement) => void;
  handleLink: (sourceId: string) => void;
}

const { Provider: BaseProvider, useProviderContext } = createArtifactProvider<Requirement>({
  type: 'requirements',
  displayName: 'Requirements',
  useData: (state) => ({
    items: state.requirements,
    setItems: state.setRequirements,
  }),
  useFS: (fs) => ({
    save: fs.saveRequirement,
    delete: fs.deleteRequirement,
    fsItems: fs.requirements,
    isReady: fs.isReady,
  }),
  useUIHelpers: (ui) => ({
    setEditingItem: ui.setEditingRequirement,
    setIsModalOpen: ui.setIsEditRequirementModalOpen,
    setLinkSourceId: ui.setLinkSourceId,
    setIsLinkModalOpen: ui.setIsLinkModalOpen,
  }),
});

export const RequirementsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return <BaseProvider>{children}</BaseProvider>;
};

export const useRequirements = (): RequirementsContextValue => {
  const context = useProviderContext();

  return {
    requirements: context.items,
    setRequirements: context.setItems,
    handleAddRequirement: context.handleAdd,
    handleUpdateRequirement: context.handleUpdate,
    handleDeleteRequirement: context.handleDelete,
    handleRestoreRequirement: context.handleRestore,
    handlePermanentDeleteRequirement: context.handlePermanentDelete,
    handleEdit: context.handleEdit,
    handleLink: context.handleLink!,
  };
};
