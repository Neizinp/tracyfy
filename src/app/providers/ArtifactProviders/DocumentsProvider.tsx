import React, { useCallback } from 'react';
import type { ReactNode } from 'react';
import type { ArtifactDocument } from '../../../types';
import { createArtifactProvider } from './BaseArtifactProvider';
import { useProject } from '../ProjectProvider';

// Define the interface to match existing usage
interface DocumentsContextValue {
  documents: ArtifactDocument[];
  setDocuments: (
    docs: ArtifactDocument[] | ((prev: ArtifactDocument[]) => ArtifactDocument[])
  ) => void;
  handleAddDocument: (
    doc: Omit<ArtifactDocument, 'id' | 'lastModified' | 'revision'>
  ) => Promise<ArtifactDocument | null>;
  handleUpdateDocument: (id: string, data: Partial<ArtifactDocument>) => Promise<void>;
  handleDeleteDocument: (id: string) => void;
  handleRestoreDocument: (id: string) => void;
  handlePermanentDeleteDocument: (id: string) => void;
  handleEdit: (doc: ArtifactDocument) => void;
}

const { Provider: BaseProvider, useProviderContext } = createArtifactProvider<ArtifactDocument>({
  type: 'documents',
  displayName: 'Documents',
  useData: (state) => ({
    items: state.documents,
    setItems: state.setDocuments,
  }),
  useFS: (fs) => ({
    save: fs.saveDocument,
    delete: fs.deleteDocument,
    fsItems: fs.documents,
    isReady: fs.isReady,
  }),
  useUIHelpers: (ui) => ({
    setEditingItem: ui.setEditingDocument,
    setIsModalOpen: ui.setIsEditDocumentModalOpen,
  }),
});

export const DocumentsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return <BaseProvider>{children}</BaseProvider>;
};

export const useDocuments = (): DocumentsContextValue => {
  const context = useProviderContext();
  const { currentProjectId } = useProject();

  const handleAddDocument = useCallback(
    async (doc: Omit<ArtifactDocument, 'id' | 'lastModified' | 'revision'>) => {
      const nextId = await context.handleAdd({
        ...doc,
        projectId: doc.projectId || currentProjectId,
      } as unknown as Omit<ArtifactDocument, 'id' | 'lastModified' | 'revision'>);
      return nextId;
    },
    [context, currentProjectId]
  );

  return {
    documents: context.items,
    setDocuments: context.setItems,
    handleAddDocument,
    handleUpdateDocument: context.handleUpdate,
    handleDeleteDocument: context.handleDelete,
    handleRestoreDocument: context.handleRestore,
    handlePermanentDeleteDocument: context.handlePermanentDelete,
    handleEdit: context.handleEdit,
  };
};
