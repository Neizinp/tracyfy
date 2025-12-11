import React, { createContext, useContext, useCallback, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useGlobalState } from '../GlobalStateProvider';
import { useUI } from '../UIProvider';
import { useFileSystem } from '../FileSystemProvider';
import { useUser } from '../UserProvider';
import type { TestCase } from '../../../types';
import { incrementRevision } from '../../../utils/revisionUtils';

interface TestCasesContextValue {
  // Data
  testCases: TestCase[];

  // CRUD operations
  handleAddTestCase: (tc: Omit<TestCase, 'id' | 'lastModified' | 'dateCreated'>) => Promise<void>;
  handleUpdateTestCase: (id: string, data: Partial<TestCase>) => Promise<void>;
  handleDeleteTestCase: (id: string) => void;
  handleRestoreTestCase: (id: string) => void;
  handlePermanentDeleteTestCase: (id: string) => void;

  // Page handlers
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
    getNextId,
  } = useFileSystem();
  const { currentUser } = useUser();
  const hasSyncedInitial = useRef(false);

  // Sync test cases from filesystem on initial load
  useEffect(() => {
    if (isReady && fsTestCases.length > 0 && !hasSyncedInitial.current) {
      console.log('[TestCasesProvider] Syncing from filesystem:', fsTestCases.length, 'test cases');
      setTestCases(fsTestCases);
      hasSyncedInitial.current = true;
    }
  }, [isReady, fsTestCases, setTestCases]);

  const handleAddTestCase = useCallback(
    async (newTcData: Omit<TestCase, 'id' | 'lastModified' | 'dateCreated'>) => {
      if (!currentUser) {
        alert(
          'Please select a user before creating artifacts.\n\nGo to Settings → Users to select a user.'
        );
        return;
      }

      const newId = await getNextId('testCases');
      const now = Date.now();

      const newTestCase: TestCase = {
        ...newTcData,
        id: newId,
        dateCreated: now,
        lastModified: now,
        revision: '01',
      };

      setTestCases((prev) => [...prev, newTestCase]);

      try {
        await saveTestCase(newTestCase);
      } catch (error) {
        console.error('Failed to save test case:', error);
      }
    },
    [currentUser, getNextId, saveTestCase, setTestCases]
  );

  const handleUpdateTestCase = useCallback(
    async (id: string, updatedData: Partial<TestCase>) => {
      const existingTc = testCases.find((tc) => tc.id === id);
      if (!existingTc) return;

      const newRevision = incrementRevision(existingTc.revision || '01');
      const finalTestCase: TestCase = {
        ...existingTc,
        ...updatedData,
        revision: newRevision,
        lastModified: Date.now(),
      };

      setTestCases((prev) => prev.map((tc) => (tc.id === id ? finalTestCase : tc)));
      setIsEditTestCaseModalOpen(false);
      setSelectedTestCaseId(null);

      try {
        await saveTestCase(finalTestCase);
      } catch (error) {
        console.error('Failed to save test case:', error);
      }
    },
    [testCases, saveTestCase, setTestCases, setSelectedTestCaseId, setIsEditTestCaseModalOpen]
  );

  const handleDeleteTestCase = useCallback(
    (id: string) => {
      const existingTc = testCases.find((tc) => tc.id === id);
      if (!existingTc) return;

      const deletedTc: TestCase = {
        ...existingTc,
        isDeleted: true,
        deletedAt: Date.now(),
      };

      setTestCases((prev) => prev.map((tc) => (tc.id === id ? deletedTc : tc)));
      setIsEditTestCaseModalOpen(false);
      setSelectedTestCaseId(null);

      saveTestCase(deletedTc).catch((err) =>
        console.error('Failed to soft-delete test case:', err)
      );
    },
    [testCases, saveTestCase, setTestCases, setSelectedTestCaseId, setIsEditTestCaseModalOpen]
  );

  const handleRestoreTestCase = useCallback(
    (id: string) => {
      const existingTc = testCases.find((tc) => tc.id === id);
      if (!existingTc) return;

      const restoredTc: TestCase = {
        ...existingTc,
        isDeleted: false,
        deletedAt: undefined,
        lastModified: Date.now(),
      };

      setTestCases((prev) => prev.map((tc) => (tc.id === id ? restoredTc : tc)));

      saveTestCase(restoredTc).catch((err) => console.error('Failed to restore test case:', err));
    },
    [testCases, saveTestCase, setTestCases]
  );

  const handlePermanentDeleteTestCase = useCallback(
    (id: string) => {
      setTestCases((prev) => prev.filter((tc) => tc.id !== id));

      fsDeleteTestCase(id).catch((err) =>
        console.error('Failed to permanently delete test case:', err)
      );
    },
    [fsDeleteTestCase, setTestCases]
  );

  const handleEditTestCase = useCallback(
    (tc: TestCase) => {
      if (!currentUser) {
        alert(
          'Please select a user before editing artifacts.\n\nGo to Settings → Users to select a user.'
        );
        return;
      }
      setSelectedTestCaseId(tc.id);
      setIsEditTestCaseModalOpen(true);
    },
    [currentUser, setSelectedTestCaseId, setIsEditTestCaseModalOpen]
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
