import React, { createContext, useContext, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useTestCases as useTestCasesHook } from '../../../hooks/useTestCases';
import { useGlobalState } from '../GlobalStateProvider';
import { useProject } from '../ProjectProvider';
import { useUI } from '../UIProvider';
import type { TestCase } from '../../../types';

interface TestCasesContextValue {
    // Data
    testCases: TestCase[];

    // CRUD operations
    handleAddTestCase: (tc: Omit<TestCase, 'id' | 'lastModified' | 'dateCreated'>) => void;
    handleUpdateTestCase: (id: string, data: Partial<TestCase>) => Promise<void>;
    handleDeleteTestCase: (id: string) => void;

    // Page handlers
    handleEditTestCase: (tc: TestCase) => void;
}

const TestCasesContext = createContext<TestCasesContextValue | undefined>(undefined);

export const TestCasesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { testCases, setTestCases, usedTestNumbers, setUsedTestNumbers } = useGlobalState();
    const { projects, currentProjectId } = useProject();
    const { setSelectedTestCaseId, setIsEditTestCaseModalOpen } = useUI();

    const testCasesHook = useTestCasesHook({
        testCases,
        setTestCases,
        usedTestNumbers,
        setUsedTestNumbers,
        projects,
        currentProjectId
    });

    const handleEditTestCase = useCallback((tc: TestCase) => {
        setSelectedTestCaseId(tc.id);
        setIsEditTestCaseModalOpen(true);
    }, [setSelectedTestCaseId, setIsEditTestCaseModalOpen]);

    const value: TestCasesContextValue = {
        testCases,
        ...testCasesHook,
        handleEditTestCase
    };

    return (
        <TestCasesContext.Provider value={value}>
            {children}
        </TestCasesContext.Provider>
    );
};

export const useTestCases = (): TestCasesContextValue => {
    const context = useContext(TestCasesContext);
    if (context === undefined) {
        throw new Error('useTestCases must be used within a TestCasesProvider');
    }
    return context;
};
