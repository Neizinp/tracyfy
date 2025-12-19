/**
 * useUseCaseForm Hook
 *
 * Manages form state and handlers for creating/editing use cases.
 * Extracted from UseCaseModal for better separation of concerns.
 */

import { useState, useEffect, useCallback } from 'react';
import type { UseCase } from '../types';
import { useUI } from '../app/providers';
import { useArtifactForm } from './useArtifactForm';
import { useArtifactNavigation } from './useArtifactNavigation';

interface UseUseCaseFormOptions {
  isOpen: boolean;
  useCase: UseCase | null | undefined;
  onClose: () => void;
  onSubmit: (
    useCase: Omit<UseCase, 'id' | 'lastModified'> | { id: string; updates: Partial<UseCase> }
  ) => void;
}

type Tab = 'overview' | 'flows' | 'conditions' | 'relationships' | 'customFields' | 'history';

export function useUseCaseForm({ isOpen, useCase, onClose, onSubmit }: UseUseCaseFormOptions) {
  useUI();
  const handleNavigateToArtifact = useArtifactNavigation(onClose);

  // Specialized fields for Use Cases
  const [actor, setActor] = useState('');
  const [preconditions, setPreconditions] = useState('');
  const [postconditions, setPostconditions] = useState('');
  const [alternativeFlows, setAlternativeFlows] = useState('');

  const {
    isEditMode,
    activeTab,
    setActiveTab,
    title,
    setTitle,
    description,
    setDescription,
    text: mainFlow,
    setText: setMainFlow,
    priority,
    setPriority,
    status,
    setStatus,
    customAttributes,
    setCustomAttributes,
    handleSubmit: baseHandleSubmit,
    handleDelete,
    confirmDelete,
    cancelDelete,
    showDeleteConfirm,
    handleRemoveLink,
  } = useArtifactForm<UseCase, Tab>({
    isOpen,
    artifact: useCase as UseCase | null,
    onClose,
    onCreate: (data) => onSubmit(data as unknown as Omit<UseCase, 'id' | 'lastModified'>),
    onUpdate: (id, updates) => onSubmit({ id, updates }),
    onDelete: () => {},
    defaultTab: 'overview',
  });

  // Sync specialized fields
  useEffect(() => {
    if (isOpen) {
      if (useCase) {
        setActor(useCase.actor || '');
        setPreconditions(useCase.preconditions || '');
        setPostconditions(useCase.postconditions || '');
        setAlternativeFlows(useCase.alternativeFlows || '');
      } else {
        setActor('');
        setPreconditions('');
        setPostconditions('');
        setAlternativeFlows('');
      }
    }
  }, [isOpen, useCase]);

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      baseHandleSubmit(e, {
        actor,
        preconditions,
        postconditions,
        alternativeFlows,
      } as Partial<UseCase>);
    },
    [baseHandleSubmit, actor, preconditions, postconditions, alternativeFlows]
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
    actor,
    setActor,
    preconditions,
    setPreconditions,
    postconditions,
    setPostconditions,
    mainFlow,
    setMainFlow,
    alternativeFlows,
    setAlternativeFlows,
    priority,
    setPriority,
    status,
    setStatus,
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
