import { useState, useEffect, useCallback } from 'react';
import type { Information } from '../types';
import { useUI } from '../app/providers';
import { useArtifactForm } from './useArtifactForm';
import { useArtifactNavigation } from './useArtifactNavigation';

interface UseInformationFormOptions {
  isOpen: boolean;
  information: Information | null;
  onClose: () => void;
  onSubmit: (
    data:
      | Omit<Information, 'id' | 'lastModified' | 'dateCreated'>
      | { id: string; updates: Partial<Information> }
  ) => void;
}

type Tab = 'overview' | 'relationships' | 'customFields' | 'history';

export function useInformationForm({
  isOpen,
  information,
  onClose,
  onSubmit,
}: UseInformationFormOptions) {
  useUI();
  const handleNavigateToArtifact = useArtifactNavigation(onClose);

  // Specialized fields for Information entries
  const [type, setType] = useState<Information['type']>('note');

  const {
    isEditMode,
    activeTab,
    setActiveTab,
    title,
    setTitle,
    text,
    setText,
    customAttributes,
    setCustomAttributes,
    handleSubmit: baseHandleSubmit,
    handleDelete,
    confirmDelete,
    cancelDelete,
    showDeleteConfirm,
    handleRemoveLink,
  } = useArtifactForm<Information, Tab>({
    isOpen,
    artifact: information,
    onClose,
    onCreate: (data) =>
      onSubmit(data as unknown as Omit<Information, 'id' | 'lastModified' | 'dateCreated'>),
    onUpdate: (id, updates) => onSubmit({ id, updates }),
    onDelete: () => {},
    defaultTab: 'overview',
  });

  // Sync specialized fields
  useEffect(() => {
    if (isOpen) {
      if (information) {
        setType(information.type);
      } else {
        setType('note');
      }
    }
  }, [isOpen, information]);

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      baseHandleSubmit(e, {
        type,
      } as Partial<Information>);
    },
    [baseHandleSubmit, type]
  );

  return {
    // Mode
    isEditMode,

    // Tab state (from base hook)
    activeTab,
    setActiveTab,

    // Form fields
    title,
    setTitle,
    text,
    setText,
    type,
    setType,
    customAttributes,
    setCustomAttributes,

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
