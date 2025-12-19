/**
 * useTestCaseForm Hook
 *
 * Manages form state and handlers for creating/editing test cases.
 * Extracted from TestCaseModal for better separation of concerns.
 */

import { useState, useEffect, useCallback } from 'react';
import type { TestCase } from '../types';
import type { CustomAttributeValue } from '../types/customAttributes';
import { useUser } from '../app/providers';
import { useBaseArtifactForm } from './useBaseArtifactForm';

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
  const { currentUser } = useUser();

  const {
    isEditMode,
    activeTab,
    setActiveTab,
    showDeleteConfirm,
    handleDelete,
    confirmDelete,
    cancelDelete,
  } = useBaseArtifactForm<TestCase, Tab>({
    isOpen,
    artifact: testCase,
    defaultTab: 'overview',
    onClose,
    onDelete,
  });

  // Form state fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TestCase['priority']>('medium');
  const [status, setStatus] = useState<TestCase['status']>('draft');
  const [customAttributes, setCustomAttributes] = useState<CustomAttributeValue[]>([]);

  // Reset form when modal opens or testCase changes
  useEffect(() => {
    if (isOpen) {
      if (testCase) {
        // Edit mode: populate from testCase
        setTitle(testCase.title);
        setDescription(testCase.description);
        setPriority(testCase.priority);
        setStatus(testCase.status);
        setCustomAttributes(testCase.customAttributes || []);
      } else {
        // Create mode: reset to defaults
        setTitle('');
        setDescription('');
        setPriority('medium');
        setStatus('draft');
        setCustomAttributes([]);
      }
    }
  }, [isOpen, testCase]);

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      if (e) e.preventDefault();

      if (isEditMode && testCase) {
        // Update existing
        const updates: Partial<TestCase> = {
          title,
          description,
          priority,
          status,
          customAttributes,
          lastModified: Date.now(),
        };

        // Update lastRun when status changes to passed/failed
        if ((status === 'passed' || status === 'failed') && testCase.status !== status) {
          updates.lastRun = Date.now();
        }

        onUpdate(testCase.id, updates);
      } else {
        // Create new
        onCreate({
          title,
          description,
          priority,
          author: currentUser?.name || undefined,
          requirementIds: [],
          customAttributes,
          status: 'draft',
          revision: '01',
        });
      }
      onClose();
    },
    [
      isEditMode,
      testCase,
      title,
      description,
      priority,
      status,
      customAttributes,
      currentUser,
      onCreate,
      onUpdate,
      onClose,
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
  };
}
