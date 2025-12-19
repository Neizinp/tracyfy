import { useState, useEffect, useCallback } from 'react';
import type { Information } from '../types';
import { useUI, useGlobalState } from '../app/providers';
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
  const { requirements, useCases, information: informationList } = useGlobalState();

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
    onCreate: (data) => onSubmit(data as any),
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

  // Navigate to a linked artifact
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
          const info = informationList.find((i) => i.id === sourceId);
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
      informationList,
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
