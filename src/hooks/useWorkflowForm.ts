/**
 * useWorkflowForm Hook
 *
 * Manages form state and handlers for creating/editing workflows.
 * Extracted from WorkflowModal for better separation of concerns.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Workflow, Requirement, UseCase, TestCase, Information, Risk } from '../types';
import {
  useUser,
  useRequirements,
  useUseCases,
  useTestCases,
  useInformation,
  useRisks,
} from '../app/providers';
import { diskWorkflowService } from '../services/diskWorkflowService';

interface UseWorkflowFormOptions {
  isOpen: boolean;
  workflow?: Workflow | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function useWorkflowForm({ isOpen, workflow, onClose, onSuccess }: UseWorkflowFormOptions) {
  const { currentUser, users } = useUser();
  const { requirements } = useRequirements();
  const { useCases } = useUseCases();
  const { testCases } = useTestCases();
  const { information } = useInformation();
  const { risks } = useRisks();

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
        setTitle(workflow.title || '');
        setDescription(workflow.description || '');
        setAssignedTo(workflow.assignedTo || '');
        setSelectedArtifactIds(workflow.artifactIds || []);
      } else {
        setTitle('');
        setDescription('');
        setAssignedTo('');
        setSelectedArtifactIds([]);
      }
      setArtifactSearch('');
    }
  }, [isOpen, workflow]);

  // Get all artifacts for selection (exclude already approved)
  const allArtifacts = useMemo(
    () => [
      ...requirements
        .filter((r: Requirement) => !r.isDeleted && r.status !== 'approved')
        .map((r: Requirement) => ({
          id: r.id,
          title: r.title,
          type: 'Requirement',
          status: r.status || 'draft',
        })),
      ...useCases
        .filter((u: UseCase) => !u.isDeleted && u.status !== 'approved')
        .map((u: UseCase) => ({
          id: u.id,
          title: u.title,
          type: 'Use Case',
          status: u.status || 'draft',
        })),
      ...testCases
        .filter((t: TestCase) => !t.isDeleted && t.status !== 'approved')
        .map((t: TestCase) => ({
          id: t.id,
          title: t.title,
          type: 'Test Case',
          status: t.status || 'draft',
        })),
      ...information
        .filter((i: Information) => !i.isDeleted)
        .map((i: Information) => ({
          id: i.id,
          title: i.title,
          type: 'Information',
          status: 'draft',
        })),
      ...risks
        .filter((r: Risk) => !r.isDeleted && r.status !== 'approved')
        .map((r: Risk) => ({
          id: r.id,
          title: r.title,
          type: 'Risk',
          status: r.status || 'identified',
        })),
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
        await diskWorkflowService.createWorkflow({
          title: title.trim(),
          description,
          revision: '01',
          createdBy: currentUser.id,
          assignedTo,
          artifactIds: selectedArtifactIds,
        });
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
