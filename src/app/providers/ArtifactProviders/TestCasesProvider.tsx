import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useTestCases as useTestCasesHook } from '../../../hooks/useTestCases';
import { useGlobalState } from '../GlobalStateProvider';
import { useProject } from '../ProjectProvider';
import type { TestCase } from '../../../types';

interface TestCasesContextValue {
    handleAddTestCase: (tc: Omit<TestCase, 'id' | 'lastModified' | 'dateCreated'>) => void;
    handleUpdateTestCase: (id: string, data: Partial<TestCase>) => Promise<void>;
    handleDeleteTestCase: (id: string) => void;
}

const TestCasesContext = createContext<TestCasesContextValue | undefined>(undefined);

export const TestCasesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { testCases, setTestCases, usedTestNumbers, setUsedTestNumbers } = useGlobalState();
    const { projects, currentProjectId } = useProject();

    const testCasesHook = useTestCasesHook({
        testCases,
        setTestCases,
        usedTestNumbers,
        setUsedTestNumbers,
        projects,
        currentProjectId
    });

    return (
        <TestCasesContext.Provider value={testCasesHook}>
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
