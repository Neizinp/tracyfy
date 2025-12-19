/**
 * useInformationForm Hook
 *
 * Manages form state and handlers for creating/editing information artifacts.
 * Extracted from InformationModal for better separation of concerns.
 */

import { useState, useEffect, useCallback } from 'react';
import type { Information } from '../types';
import { useArtifactForm } from './useArtifactForm';

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
  } = useArtifactForm<Information, Tab>({
    isOpen,
    artifact: information,
    onClose,
    onCreate: (data) => onSubmit(data),
    onUpdate: (id, updates) => onSubmit({ id, updates }),
    onDelete: () => {}, // Not supported here currently
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
  };
}
