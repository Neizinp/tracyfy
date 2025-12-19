/**
 * useRequirementForm Hook
 *
 * Manages form state and handlers for creating/editing requirements.
 * Extracted from RequirementModal for better separation of concerns.
 */

import { useState, useEffect, useCallback } from 'react';
import type { Requirement } from '../types';
import { useUI, useGlobalState } from '../app/providers';
import { useArtifactForm } from './useArtifactForm';

interface UseRequirementFormOptions {
  isOpen: boolean;
  requirement: Requirement | null;
  onClose: () => void;
  onCreate: (req: Omit<Requirement, 'id' | 'children' | 'lastModified'>) => void;
  onUpdate: (id: string, updates: Partial<Requirement>) => void;
  onDelete: (id: string) => void;
}

type Tab = 'overview' | 'details' | 'relationships' | 'comments' | 'customFields' | 'history';

export function useRequirementForm({
  isOpen,
  requirement,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
}: UseRequirementFormOptions) {
  const {
    setEditingRequirement,
    setIsEditRequirementModalOpen,
    setEditingUseCase,
    setIsUseCaseModalOpen,
    setSelectedTestCaseId,
    setIsEditTestCaseModalOpen,
    setSelectedInformation,
    setIsInformationModalOpen,
  } = useUI();
  const { requirements, useCases, information } = useGlobalState();

  // Specialized fields for Requirements
  const [rationale, setRationale] = useState('');
  const [verificationMethod, setVerificationMethod] = useState('');
  const [comments, setComments] = useState('');

  const {
    isEditMode,
    currentUser,
    activeTab,
    setActiveTab,
    title,
    setTitle,
    description,
    setDescription,
    text,
    setText,
    priority,
    setPriority,
    status,
    setStatus,
    linkedArtifacts,
    setLinkedArtifacts,
    customAttributes,
    setCustomAttributes,
    handleSubmit: baseHandleSubmit,
    handleRemoveLink,
    handleDelete,
    confirmDelete,
    cancelDelete,
    showDeleteConfirm,
  } = useArtifactForm<Requirement, Tab>({
    isOpen,
    artifact: requirement,
    onClose,
    onCreate,
    onUpdate,
    onDelete,
    defaultTab: 'overview',
  });

  // Sync specialized fields
  useEffect(() => {
    if (isOpen) {
      if (requirement) {
        setRationale(requirement.rationale || '');
        setVerificationMethod(requirement.verificationMethod || '');
        setComments(requirement.comments || '');
      } else {
        setRationale('');
        setVerificationMethod('');
        setComments('');
      }
    }
  }, [isOpen, requirement]);

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      baseHandleSubmit(e, {
        rationale,
        verificationMethod,
        comments,
      } as Partial<Requirement>);
    },
    [baseHandleSubmit, rationale, verificationMethod, comments]
  );

  // Navigate to a linked artifact by opening its edit modal
  const handleNavigateToArtifact = useCallback(
    (sourceId: string, sourceType: string) => {
      onClose();

      switch (sourceType) {
        case 'requirement': {
          const req = requirements.find((r) => r.id === sourceId);
          if (req) {
            setEditingRequirement(req);
            setIsEditRequirementModalOpen(true);
          }
          break;
        }
        case 'useCase': {
          const uc = useCases.find((u) => u.id === sourceId);
          if (uc) {
            setEditingUseCase(uc);
            setIsUseCaseModalOpen(true);
          }
          break;
        }
        case 'testCase': {
          setSelectedTestCaseId(sourceId);
          setIsEditTestCaseModalOpen(true);
          break;
        }
        case 'information': {
          const info = information.find((i) => i.id === sourceId);
          if (info) {
            setSelectedInformation(info);
            setIsInformationModalOpen(true);
          }
          break;
        }
      }
    },
    [
      onClose,
      requirements,
      useCases,
      information,
      setEditingRequirement,
      setIsEditRequirementModalOpen,
      setEditingUseCase,
      setIsUseCaseModalOpen,
      setSelectedTestCaseId,
      setIsEditTestCaseModalOpen,
      setSelectedInformation,
      setIsInformationModalOpen,
    ]
  );

  return {
    // Mode
    isEditMode,
    currentUser,

    // Tab state (from base hook)
    activeTab,
    setActiveTab,

    // Form fields
    title,
    setTitle,
    description,
    setDescription,
    text,
    setText,
    rationale,
    setRationale,
    priority,
    setPriority,
    status,
    setStatus,
    verificationMethod,
    setVerificationMethod,
    comments,
    setComments,
    linkedArtifacts,
    setLinkedArtifacts,
    customAttributes,
    setCustomAttributes,

    // Actions (including from base hook)
    handleSubmit,
    handleRemoveLink,
    handleNavigateToArtifact,
    handleDelete,
    confirmDelete,
    cancelDelete,
    showDeleteConfirm,
  };
}
