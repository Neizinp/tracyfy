/**
 * useWorkflowForm Hook
 *
 * Manages form state and handlers for creating/editing workflows.
 * Extracted from WorkflowModal for better separation of concerns.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Workflow } from '../types';
import { useUser } from '../app/providers';
import { useFileSystem } from '../app/providers/FileSystemProvider';
import { diskWorkflowService } from '../services/diskWorkflowService';

interface UseWorkflowFormOptions {
  isOpen: boolean;
  workflow?: Workflow | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function useWorkflowForm({ isOpen, workflow, onClose, onSuccess }: UseWorkflowFormOptions) {
  const { currentUser, users } = useUser();
  const { requirements, useCases, testCases, information, risks } = useFileSystem();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [selectedArtifactIds, setSelectedArtifactIds] = useState<string[]>([]);
  const [artifactSearch, setArtifactSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens/closes or workflow changes
  useEffect(() => {
    if (isOpen) {
      if (workflow) {
        setTitle(workflow.title);
        setDescription(workflow.description);
        setAssignedTo(workflow.assignedTo);
        setSelectedArtifactIds(workflow.artifactIds);
      } else {
        setTitle('');
        setDescription('');
        setAssignedTo('');
        setSelectedArtifactIds([]);
      }
      setArtifactSearch('');
    }
  }, [isOpen, workflow]);

  // Get all artifacts for selection
  const allArtifacts = useMemo(
    () => [
      ...requirements
        .filter((r) => !r.isDeleted)
        .map((r) => ({ id: r.id, title: r.title, type: 'Requirement', status: r.status })),
      ...useCases
        .filter((u) => !u.isDeleted)
        .map((u) => ({ id: u.id, title: u.title, type: 'Use Case', status: u.status })),
      ...testCases
        .filter((t) => !t.isDeleted)
        .map((t) => ({ id: t.id, title: t.title, type: 'Test Case', status: t.status })),
      ...information
        .filter((i) => !i.isDeleted)
        .map((i) => ({ id: i.id, title: i.title, type: 'Information', status: 'draft' })),
      ...risks
        .filter((r) => !r.isDeleted)
        .map((r) => ({ id: r.id, title: r.title, type: 'Risk', status: r.status })),
    ],
    [requirements, useCases, testCases, information, risks]
  );

  // Filter artifacts by search
  const filteredArtifacts = useMemo(() => {
    if (!artifactSearch) return allArtifacts;
    const search = artifactSearch.toLowerCase();
    return allArtifacts.filter(
      (artifact) =>
        artifact.id.toLowerCase().includes(search) ||
        artifact.title.toLowerCase().includes(search) ||
        artifact.type.toLowerCase().includes(search)
    );
  }, [allArtifacts, artifactSearch]);

  // Available artifacts (not already selected)
  const availableArtifacts = useMemo(
    () => filteredArtifacts.filter((a) => !selectedArtifactIds.includes(a.id)),
    [filteredArtifacts, selectedArtifactIds]
  );

  // Other users (excluding current user for assignment)
  const otherUsers = useMemo(
    () => users.filter((u) => u.id !== currentUser?.id),
    [users, currentUser?.id]
  );

  const handleAddArtifact = useCallback((id: string) => {
    setSelectedArtifactIds((prev) => [...prev, id]);
    setArtifactSearch('');
  }, []);

  const handleRemoveArtifact = useCallback((id: string) => {
    setSelectedArtifactIds((prev) => prev.filter((a) => a !== id));
  }, []);

  const getArtifactInfo = useCallback(
    (id: string) => allArtifacts.find((a) => a.id === id),
    [allArtifacts]
  );

  const isValid = title.trim() && assignedTo && selectedArtifactIds.length > 0;

  const handleSubmit = useCallback(async () => {
    if (!currentUser) return;
    if (!isValid) return;

    setIsSubmitting(true);
    try {
      if (workflow) {
        await diskWorkflowService.updateWorkflow(workflow.id, {
          title: title.trim(),
          description,
          assignedTo,
          artifactIds: selectedArtifactIds,
        });
      } else {
        await diskWorkflowService.createWorkflow(
          title.trim(),
          description,
          currentUser.id,
          assignedTo,
          selectedArtifactIds
        );
      }
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Failed to save workflow:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    currentUser,
    isValid,
    title,
    description,
    assignedTo,
    selectedArtifactIds,
    workflow,
    onSuccess,
    onClose,
  ]);

  return {
    // Form fields
    title,
    setTitle,
    description,
    setDescription,
    assignedTo,
    setAssignedTo,
    selectedArtifactIds,
    artifactSearch,
    setArtifactSearch,

    // State
    isSubmitting,
    isValid,

    // Computed
    allArtifacts,
    availableArtifacts,
    otherUsers,

    // Actions
    handleAddArtifact,
    handleRemoveArtifact,
    getArtifactInfo,
    handleSubmit,
  };
}
