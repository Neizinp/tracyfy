/**
 * useProjectSettingsForm Hook
 *
 * Manages form state and handlers for the ProjectSettingsModal.
 * Includes project rename, copy, and delete functionality.
 */

import { useState, useEffect, useCallback } from 'react';
import type { Project } from '../types';

interface UseProjectSettingsFormOptions {
  isOpen: boolean;
  project: Project;
  onClose: () => void;
  onUpdate: (projectId: string, name: string, description: string) => Promise<void>;
  onDelete: (projectId: string) => void;
  onCopy?: (originalProject: Project, newName: string, newDescription: string) => Promise<void>;
}

export function useProjectSettingsForm({
  isOpen,
  project,
  onClose,
  onUpdate,
  onDelete,
  onCopy,
}: UseProjectSettingsFormOptions) {
  // Form state
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRenameConfirm, setShowRenameConfirm] = useState(false);
  const [showCopyMode, setShowCopyMode] = useState(false);
  const [copyName, setCopyName] = useState('');
  const [copyDescription, setCopyDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setName(project.name);
      setDescription(project.description);
      setShowDeleteConfirm(false);
      setShowRenameConfirm(false);
      setShowCopyMode(false);
      setCopyName(`${project.name} (Copy)`);
      setCopyDescription(project.description);
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, project]);

  const isNameChanged = name.trim() !== project.name;

  const doSave = useCallback(async () => {
    setError(null);
    setIsSubmitting(true);
    setShowRenameConfirm(false);

    try {
      await onUpdate(project.id, name, description);
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  }, [project.id, name, description, onUpdate, onClose]);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();

      if (isNameChanged) {
        setShowRenameConfirm(true);
        return;
      }

      await doSave();
    },
    [isNameChanged, doSave]
  );

  const handleCopyProject = useCallback(async () => {
    if (!copyName.trim()) {
      setError('Please enter a name for the new project');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onCopy?.(project, copyName.trim(), copyDescription.trim());
      setIsSubmitting(false);
      onClose();
    } catch (err) {
      setError((err as Error).message);
      setIsSubmitting(false);
    }
  }, [copyName, copyDescription, project, onCopy, onClose]);

  const handleDelete = useCallback(() => {
    onDelete(project.id);
    onClose();
  }, [project.id, onDelete, onClose]);

  const cancelRenameConfirm = useCallback(() => {
    setShowRenameConfirm(false);
  }, []);

  const cancelCopyMode = useCallback(() => {
    setShowCopyMode(false);
  }, []);

  const cancelDeleteConfirm = useCallback(() => {
    setShowDeleteConfirm(false);
  }, []);

  const startCopyMode = useCallback(() => {
    setShowCopyMode(true);
  }, []);

  const startDeleteConfirm = useCallback(() => {
    setShowDeleteConfirm(true);
  }, []);

  return {
    // Form fields
    name,
    setName,
    description,
    setDescription,

    // Copy mode
    copyName,
    setCopyName,
    copyDescription,
    setCopyDescription,
    showCopyMode,
    startCopyMode,
    cancelCopyMode,

    // Delete mode
    showDeleteConfirm,
    startDeleteConfirm,
    cancelDeleteConfirm,

    // Rename confirmation
    showRenameConfirm,
    cancelRenameConfirm,

    // State
    error,
    isSubmitting,
    isNameChanged,

    // Actions
    handleSubmit,
    handleCopyProject,
    handleDelete,
    doSave,
  };
}
