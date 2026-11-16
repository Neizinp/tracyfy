import React from 'react';
import type { ReactNode } from 'react';
import type { ArtifactDocument } from '../../../types';
import { createArtifactProvider } from './BaseArtifactProvider';

// Define the interface to match existing usage
interface DocumentsContextValue {
  documents: ArtifactDocument[];
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
  type: 'document',
  displayName: 'Documents',
  useData: (state) => ({
    items: state.documents,
  }),
  useFS: (fs) => ({
    save: fs.saveDocument,
    delete: fs.deleteDocument,
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
  return {
    documents: context.items,
    handleAddDocument: context.handleAdd,
    handleUpdateDocument: context.handleUpdate,
    handleDeleteDocument: context.handleDelete,
    handleRestoreDocument: context.handleRestore,
    handlePermanentDeleteDocument: context.handlePermanentDelete,
    handleEdit: context.handleEdit,
  };
};
