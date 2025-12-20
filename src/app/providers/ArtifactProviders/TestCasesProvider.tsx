import React, { useCallback } from 'react';
import type { ReactNode } from 'react';
import { useUI } from '../UIProvider';
import type { TestCase } from '../../../types';
import { createArtifactProvider } from './BaseArtifactProvider';

interface TestCasesContextValue {
  testCases: TestCase[];
  handleAddTestCase: (
    tc: Omit<TestCase, 'id' | 'lastModified' | 'dateCreated' | 'revision'>
  ) => Promise<TestCase | null>;
  handleUpdateTestCase: (id: string, data: Partial<TestCase>) => Promise<void>;
  handleDeleteTestCase: (id: string) => void;
  handleRestoreTestCase: (id: string) => void;
  handlePermanentDeleteTestCase: (id: string) => void;
  handleEditTestCase: (tc: TestCase) => void;
}

const { Provider: BaseProvider, useProviderContext } = createArtifactProvider<TestCase>({
  type: 'testCases',
  displayName: 'TestCases',
  useData: (state) => ({
    items: state.testCases,
    setItems: state.setTestCases,
  }),
  useFS: (fs) => ({
    save: fs.saveTestCase,
    delete: fs.deleteTestCase,
    fsItems: fs.testCases,
    isReady: fs.isReady,
  }),
  useUIHelpers: (ui) => ({
    setEditingItem: (tc) => ui.setSelectedTestCaseId(tc ? tc.id : null),
    setIsModalOpen: ui.setIsEditTestCaseModalOpen,
  }),
});

export const TestCasesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return <BaseProvider>{children}</BaseProvider>;
};

export const useTestCases = (): TestCasesContextValue => {
  const context = useProviderContext();
  const { setSelectedTestCaseId } = useUI();

  const handleEditTestCase = useCallback(
    (tc: TestCase) => {
      setSelectedTestCaseId(tc.id);
      context.handleEdit(tc);
    },
    [context, setSelectedTestCaseId]
  );

  return {
    testCases: context.items,
    handleAddTestCase: (data) => context.handleAdd({ ...data, dateCreated: Date.now() }),
    handleUpdateTestCase: context.handleUpdate,
    handleDeleteTestCase: context.handleDelete,
    handleRestoreTestCase: context.handleRestore,
    handlePermanentDeleteTestCase: context.handlePermanentDelete,
    handleEditTestCase,
  };
};
