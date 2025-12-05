import React, { createContext, useContext, useCallback, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useTestCases as useTestCasesHook } from '../../../hooks/useTestCases';
import { useGlobalState } from '../GlobalStateProvider';

import { useUI } from '../UIProvider';
import { useFileSystem } from '../FileSystemProvider';
import type { TestCase } from '../../../types';

interface TestCasesContextValue {
  // Data
  testCases: TestCase[];

  // CRUD operations
  handleAddTestCase: (tc: Omit<TestCase, 'id' | 'lastModified' | 'dateCreated'>) => void;
  handleUpdateTestCase: (id: string, data: Partial<TestCase>) => Promise<void>;
  handleDeleteTestCase: (id: string) => void;
  handlePermanentDeleteTestCase: (id: string) => void;

  // Page handlers
  handleEditTestCase: (tc: TestCase) => void;
}

const TestCasesContext = createContext<TestCasesContextValue | undefined>(undefined);

export const TestCasesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { testCases, setTestCases, usedTestNumbers, setUsedTestNumbers } = useGlobalState();
  const { setSelectedTestCaseId, setIsEditTestCaseModalOpen } = useUI();
  const { saveArtifact, deleteArtifact, loadedData, isReady } = useFileSystem();
  const hasSyncedInitial = useRef(false);

  // Sync loaded data from filesystem
  useEffect(() => {
    if (isReady && loadedData && loadedData.testCases) {
      setTestCases(loadedData.testCases);

      // Update used numbers
      const used = new Set<number>();
      loadedData.testCases.forEach((tc) => {
        const match = tc.id.match(/-(\d+)$/);
        if (match) {
          used.add(parseInt(match[1], 10));
        }
      });
      setUsedTestNumbers(used);
    }
  }, [isReady, loadedData, setTestCases, setUsedTestNumbers]);

  // Sync in-memory data to filesystem if filesystem is empty (on initial load)
  useEffect(() => {
    const syncInitial = async () => {
      if (!isReady || !loadedData || hasSyncedInitial.current) return;

      // If filesystem loaded no test cases but we have them in memory,
      // write them to disk (happens when filesystem is empty but localStorage has demo data)
      if (loadedData.testCases.length === 0 && testCases.length > 0) {
        hasSyncedInitial.current = true;
        for (const tc of testCases) {
          try {
            await saveArtifact('testcases', tc.id, tc);
          } catch (error) {
            console.error('Failed to sync test case to filesystem:', error);
          }
        }
      }
    };

    syncInitial();
  }, [isReady, loadedData, testCases, saveArtifact]);

  const testCasesHook = useTestCasesHook({
    testCases,
    setTestCases,
    usedTestNumbers,
    setUsedTestNumbers,
    saveArtifact,
    deleteArtifact,
  });

  const handleEditTestCase = useCallback(
    (tc: TestCase) => {
      setSelectedTestCaseId(tc.id);
      setIsEditTestCaseModalOpen(true);
    },
    [setSelectedTestCaseId, setIsEditTestCaseModalOpen]
  );

  const value: TestCasesContextValue = {
    testCases,
    ...testCasesHook,
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
