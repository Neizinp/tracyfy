/**
 * useUseCaseForm Hook
 *
 * Manages form state and handlers for creating/editing use cases.
 * Extracted from UseCaseModal for better separation of concerns.
 */

import { useState, useEffect, useCallback } from 'react';
import type { UseCase } from '../types';
import type { CustomAttributeValue } from '../types/customAttributes';

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
  const isEditMode = useCase !== null && useCase !== undefined;

  // Form state
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [actor, setActor] = useState('');
  const [preconditions, setPreconditions] = useState('');
  const [postconditions, setPostconditions] = useState('');
  const [mainFlow, setMainFlow] = useState('');
  const [alternativeFlows, setAlternativeFlows] = useState('');
  const [priority, setPriority] = useState<UseCase['priority']>('medium');
  const [status, setStatus] = useState<UseCase['status']>('draft');
  const [customAttributes, setCustomAttributes] = useState<CustomAttributeValue[]>([]);

  // Reset form when modal opens/closes or useCase changes
  useEffect(() => {
    if (useCase) {
      setTitle(useCase.title);
      setDescription(useCase.description);
      setActor(useCase.actor);
      setPreconditions(useCase.preconditions);
      setPostconditions(useCase.postconditions);
      setMainFlow(useCase.mainFlow);
      setAlternativeFlows(useCase.alternativeFlows || '');
      setPriority(useCase.priority);
      setStatus(useCase.status);
      setCustomAttributes(useCase.customAttributes || []);
    } else {
      setTitle('');
      setDescription('');
      setActor('');
      setPreconditions('');
      setPostconditions('');
      setMainFlow('');
      setAlternativeFlows('');
      setPriority('medium');
      setStatus('draft');
      setCustomAttributes([]);
    }
  }, [useCase, isOpen]);

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      if (e) e.preventDefault();

      if (useCase) {
        onSubmit({
          id: useCase.id,
          updates: {
            title,
            description,
            actor,
            preconditions,
            postconditions,
            mainFlow,
            alternativeFlows,
            priority,
            status,
            customAttributes,
          },
        });
      } else {
        onSubmit({
          title,
          description,
          actor,
          preconditions,
          postconditions,
          mainFlow,
          alternativeFlows,
          priority,
          status,
          customAttributes,
          revision: '01',
        });
      }
      onClose();
    },
    [
      useCase,
      title,
      description,
      actor,
      preconditions,
      postconditions,
      mainFlow,
      alternativeFlows,
      priority,
      status,
      customAttributes,
      onSubmit,
      onClose,
    ]
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
  };
}
