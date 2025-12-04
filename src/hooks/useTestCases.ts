import type { TestCase, Project } from '../types';
import { generateNextTestCaseId } from '../utils/idGenerationUtils';
import { incrementRevision } from '../utils/revisionUtils';
import { gitService } from '../services/gitService';

interface UseTestCasesProps {
    testCases: TestCase[];
    setTestCases: (tcs: TestCase[] | ((prev: TestCase[]) => TestCase[])) => void;
    usedTestNumbers: Set<number>;
    setUsedTestNumbers: (nums: Set<number> | ((prev: Set<number>) => Set<number>)) => void;
    projects: Project[];
    currentProjectId: string;
}

export function useTestCases({
    testCases,
    setTestCases,
    usedTestNumbers,
    setUsedTestNumbers,
    projects,
    currentProjectId
}: UseTestCasesProps) {

    const handleAddTestCase = async (newTestCaseData: Omit<TestCase, 'id' | 'lastModified' | 'dateCreated'>) => {
        const newTestCase: TestCase = {
            ...newTestCaseData,
            id: generateNextTestCaseId(usedTestNumbers),
            dateCreated: Date.now(),
            lastModified: Date.now()
        };

        setTestCases([...testCases, newTestCase]);
        // Mark this number as used (extract number from ID)
        const idNumber = parseInt(newTestCase.id.split('-')[1], 10);
        setUsedTestNumbers(new Set([...usedTestNumbers, idNumber]));

        // Save to git repository to make it appear in Pending Changes
        try {
            const project = projects.find(p => p.id === currentProjectId);
            if (project) {
                await gitService.saveArtifact('testcases', newTestCase);
            }
        } catch (error) {
            console.error('Failed to save test case to git:', error);
        }
    };

    const handleUpdateTestCase = async (id: string, updates: Partial<TestCase>) => {
        const updatedTestCase = testCases.find(tc => tc.id === id);
        if (!updatedTestCase) return;

        // Increment revision
        const newRevision = incrementRevision(updatedTestCase.revision || '01');
        const finalTestCase = {
            ...updatedTestCase,
            ...updates,
            revision: newRevision,
            lastModified: Date.now()
        };

        setTestCases(prev => prev.map(tc =>
            tc.id === finalTestCase.id ? finalTestCase : tc
        ));

        // Save to git repository to make it appear in Pending Changes
        try {
            const project = projects.find(p => p.id === currentProjectId);
            if (project) {
                await gitService.saveArtifact('testcases', finalTestCase);
                await gitService.commitArtifact(
                    'testcases',
                    finalTestCase.id,
                    `Update test case ${finalTestCase.id}: ${finalTestCase.title} (Rev ${newRevision})`
                );
            }
        } catch (error) {
            console.error('Failed to save test case to git:', error);
        }
    };

    const handleDeleteTestCase = (id: string) => {
        setTestCases(testCases.map(tc =>
            tc.id === id ? { ...tc, isDeleted: true, deletedAt: Date.now() } : tc
        ));
    };

    return {
        handleAddTestCase,
        handleUpdateTestCase,
        handleDeleteTestCase
    };
}
