import { useCallback, useState, useEffect } from 'react';
import type { ArtifactDocument, DocumentEntry } from '../types';
import { useArtifactForm } from './useArtifactForm';
import { useArtifactNavigation } from './useArtifactNavigation';

interface UseDocumentFormOptions {
  isOpen: boolean;
  document: ArtifactDocument | null;
  onClose: () => void;
  onSubmit: (
    data:
      | Omit<ArtifactDocument, 'id' | 'lastModified' | 'revision'>
      | { id: string; updates: Partial<ArtifactDocument> }
  ) => void;
}

type Tab = 'overview' | 'content' | 'relationships' | 'customAttributes' | 'history';

export function useDocumentForm({ isOpen, document, onClose, onSubmit }: UseDocumentFormOptions) {
  const handleNavigateToArtifact = useArtifactNavigation(onClose);

  const [structure, setStructure] = useState<DocumentEntry[]>([]);

  useEffect(() => {
    if (isOpen) {
      if (document) {
        setStructure(document.structure || []);
      } else {
        setStructure([]);
      }
    }
  }, [isOpen, document]);

  const {
    isEditMode,
    activeTab,
    setActiveTab,
    title,
    setTitle,
    description,
    setDescription,
    status,
    setStatus,
    customAttributes,
    setCustomAttributes,
    author,
    setAuthor,
    currentUser,
    handleSubmit: baseHandleSubmit,
    handleDelete,
    confirmDelete,
    cancelDelete,
    showDeleteConfirm,
    handleRemoveLink,
  } = useArtifactForm<ArtifactDocument, Tab>({
    isOpen,
    artifact: document,
    onClose,
    onCreate: (data) =>
      onSubmit(data as unknown as Omit<ArtifactDocument, 'id' | 'lastModified' | 'revision'>),
    onUpdate: (id, updates) => onSubmit({ id, updates }),
    onDelete: () => {},
    defaultTab: 'overview',
  });

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      baseHandleSubmit(e, { structure } as Partial<ArtifactDocument>);
    },
    [baseHandleSubmit, structure]
  );

  return {
    // Mode
    isEditMode,

    // Tab state
    activeTab,
    setActiveTab,

    // Form fields
    title,
    setTitle,
    description,
    setDescription,
    status,
    setStatus,
    customAttributes,
    setCustomAttributes,
    author,
    setAuthor,
    currentUser,
    structure,
    setStructure,

    // Actions
    handleSubmit,
    handleDelete,
    confirmDelete,
    cancelDelete,
    showDeleteConfirm,
    handleRemoveLink,
    handleNavigateToArtifact,
  };
}
