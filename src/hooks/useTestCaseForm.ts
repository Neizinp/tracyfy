import { useCallback } from 'react';
import type { TestCase } from '../types';
import { useUI } from '../app/providers';
import { useArtifactForm } from './useArtifactForm';
import { useArtifactNavigation } from './useArtifactNavigation';

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
  useUI();
  const handleNavigateToArtifact = useArtifactNavigation(onClose);

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
    onCreate: (data) =>
      onCreate(data as unknown as Omit<TestCase, 'id' | 'lastModified' | 'dateCreated'>),
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
