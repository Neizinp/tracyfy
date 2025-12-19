import { useState, useCallback, useEffect } from 'react';

interface UseBaseArtifactFormOptions<T, TabType extends string> {
  isOpen: boolean;
  artifact: T | null | undefined;
  defaultTab: TabType;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

/**
 * A generic base hook for artifact management forms.
 * Handles common concerns like tab management, edit mode detection,
 * and delete confirmation logic.
 */
export function useBaseArtifactForm<T extends { id: string }, TabType extends string>({
  isOpen,
  artifact,
  defaultTab,
  onClose,
  onDelete,
}: UseBaseArtifactFormOptions<T, TabType>) {
  const isEditMode = artifact !== null && artifact !== undefined;
  const [activeTab, setActiveTab] = useState<TabType>(defaultTab);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Reset tab and delete confirmation when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
      setShowDeleteConfirm(false);
    }
  }, [isOpen, defaultTab]);

  const handleDelete = useCallback(() => {
    setShowDeleteConfirm(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (artifact && onDelete) {
      onDelete(artifact.id);
      onClose();
    }
  }, [artifact, onDelete, onClose]);

  const cancelDelete = useCallback(() => {
    setShowDeleteConfirm(false);
  }, []);

  return {
    isEditMode,
    activeTab,
    setActiveTab,
    showDeleteConfirm,
    handleDelete,
    confirmDelete,
    cancelDelete,
  };
}
