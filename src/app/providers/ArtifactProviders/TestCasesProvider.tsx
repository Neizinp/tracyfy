import React, { createContext, useContext, useCallback, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useGlobalState } from '../GlobalStateProvider';
import { useUI } from '../UIProvider';
import { useFileSystem } from '../FileSystemProvider';
import { useUser } from '../UserProvider';
import { useToast } from '../ToastProvider';
import { debug } from '../../../utils/debug';
import type { TestCase } from '../../../types';
import { useArtifactCRUD } from './useArtifactCRUD';

interface TestCasesContextValue {
  // Data
  testCases: TestCase[];

  // CRUD operations
  handleAddTestCase: (
    tc: Omit<TestCase, 'id' | 'lastModified' | 'dateCreated' | 'revision'>
  ) => Promise<TestCase | null>;
  handleUpdateTestCase: (id: string, data: Partial<TestCase>) => Promise<void>;
  handleDeleteTestCase: (id: string) => void;
  handleRestoreTestCase: (id: string) => void;
  handlePermanentDeleteTestCase: (id: string) => void;
  handleEditTestCase: (tc: TestCase) => void;
}

const TestCasesContext = createContext<TestCasesContextValue | undefined>(undefined);

export const TestCasesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { testCases, setTestCases } = useGlobalState();
  const { setSelectedTestCaseId, setIsEditTestCaseModalOpen } = useUI();
  const {
    saveTestCase,
    deleteTestCase: fsDeleteTestCase,
    testCases: fsTestCases,
    isReady,
  } = useFileSystem();
  const { currentUser } = useUser();
  const { showToast } = useToast();
  const hasSyncedInitial = useRef(false);

  // Sync test cases from filesystem on initial load
  useEffect(() => {
    if (isReady && fsTestCases.length > 0 && !hasSyncedInitial.current) {
      debug.log('[TestCasesProvider] Syncing from filesystem:', fsTestCases.length, 'test cases');
      setTestCases(fsTestCases);
      hasSyncedInitial.current = true;
    }
  }, [isReady, fsTestCases, setTestCases]);

  const {
    handleAdd: handleAddInternal,
    handleUpdate: handleUpdateTestCase,
    handleDelete: handleDeleteTestCase,
    handleRestore: handleRestoreTestCase,
    handlePermanentDelete: handlePermanentDeleteTestCase,
  } = useArtifactCRUD<TestCase>({
    type: 'testCases',
    items: testCases,
    setItems: setTestCases,
    saveFn: saveTestCase,
    deleteFn: fsDeleteTestCase,
    onAfterUpdate: () => {
      setIsEditTestCaseModalOpen(false);
      setSelectedTestCaseId(null);
    },
  });

  const handleAddTestCase = useCallback(
    (data: Omit<TestCase, 'id' | 'lastModified' | 'dateCreated' | 'revision'>) => {
      const fullData = {
        ...data,
        dateCreated: Date.now(),
      } as Omit<TestCase, 'id' | 'lastModified' | 'revision'>;
      return handleAddInternal(fullData);
    },
    [handleAddInternal]
  );

  const handleEditTestCase = useCallback(
    (tc: TestCase) => {
      if (!currentUser) {
        showToast(
          'Please select a user before editing artifacts. Go to Settings → Users to select a user.',
          'warning'
        );
        return;
      }
      setSelectedTestCaseId(tc.id);
      setIsEditTestCaseModalOpen(true);
    },
    [currentUser, setSelectedTestCaseId, setIsEditTestCaseModalOpen, showToast]
  );

  const value: TestCasesContextValue = {
    testCases,
    handleAddTestCase,
    handleUpdateTestCase,
    handleDeleteTestCase,
    handleRestoreTestCase,
    handlePermanentDeleteTestCase,
    handleEditTestCase,
  };

  return <TestCasesContext.Provider value={value}>{children}</TestCasesContext.Provider>;
};

export const useTestCases = (): TestCasesContextValue => {
  const context = useContext(TestCasesContext);
  if (context === undefined) {
    throw new Error('useTestCases must be used within a TestCasesProvider');
  }
  return context;
};
