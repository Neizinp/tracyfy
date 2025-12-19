import { useCallback } from 'react';
import type { TestCase } from '../types';
import { useUI, useGlobalState } from '../app/providers';
import { useArtifactForm } from './useArtifactForm';

interface UseTestCaseFormOptions {
  isOpen: boolean;
  testCase: TestCase | null;
  onClose: () => void;
  onCreate: (testCase: Omit<TestCase, 'id' | 'lastModified' | 'dateCreated'>) => void;
  onUpdate: (id: string, updates: Partial<TestCase>) => void;
  onDelete: (id: string) => void;
}

type Tab = 'overview' | 'relationships' | 'customFields' | 'history';

export function useTestCaseForm({
  isOpen,
  testCase,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
}: UseTestCaseFormOptions) {
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

  const {
    isEditMode,
    currentUser,
    activeTab,
    setActiveTab,
    title,
    setTitle,
    description,
    setDescription,
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
  } = useArtifactForm<TestCase, Tab>({
    isOpen,
    artifact: testCase,
    onClose,
    onCreate: (data) => onCreate(data as any),
    onUpdate,
    onDelete,
    defaultTab: 'overview',
  });

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      const updates: Partial<TestCase> = {};

      // Update lastRun when status changes to passed/failed
      if (
        (status === 'passed' || status === 'failed') &&
        (!testCase || testCase.status !== status)
      ) {
        updates.lastRun = Date.now();
      }

      baseHandleSubmit(e, updates);
    },
    [baseHandleSubmit, status, testCase]
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
    priority,
    setPriority,
    status,
    setStatus,
    customAttributes,
    setCustomAttributes,

    // Actions (including from base hook)
    handleSubmit,
    handleDelete,
    confirmDelete,
    cancelDelete,
    showDeleteConfirm,
    handleRemoveLink,
    handleNavigateToArtifact,
  };
}
