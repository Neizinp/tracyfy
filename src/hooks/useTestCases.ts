import type { TestCase } from '../types';
import { generateNextTestCaseId } from '../utils/idGenerationUtils';
import { incrementRevision } from '../utils/revisionUtils';

interface UseTestCasesProps {
    testCases: TestCase[];
    setTestCases: (tcs: TestCase[] | ((prev: TestCase[]) => TestCase[])) => void;
    usedTestNumbers: Set<number>;
    setUsedTestNumbers: (nums: Set<number> | ((prev: Set<number>) => Set<number>)) => void;

    saveArtifact: (type: 'testcases', id: string, artifact: TestCase) => Promise<void>;
    deleteArtifact: (type: 'testcases', id: string) => Promise<void>;
}

export function useTestCases({
    testCases,
    setTestCases,
    usedTestNumbers,
    setUsedTestNumbers,
    saveArtifact,
    deleteArtifact
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

        // Save to filesystem
        try {
            await saveArtifact('testcases', newTestCase.id, newTestCase);
        } catch (error) {
            console.error('Failed to save test case:', error);
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

        // Save to filesystem
        try {
            await saveArtifact('testcases', finalTestCase.id, finalTestCase);
        } catch (error) {
            console.error('Failed to save test case:', error);
        }
    };

    const handleDeleteTestCase = (id: string) => {
        const updatedTestCase = testCases.find(tc => tc.id === id);
        if (!updatedTestCase) return;

        // Soft delete
        const deletedTestCase = { ...updatedTestCase, isDeleted: true, deletedAt: Date.now() };

        setTestCases(testCases.map(tc =>
            tc.id === id ? deletedTestCase : tc
        ));

        // Save soft deleted state
        saveArtifact('testcases', id, deletedTestCase).catch(err =>
            console.error('Failed to save deleted test case:', err)
        );
    };

    const handlePermanentDeleteTestCase = (id: string) => {
        setTestCases(prev => prev.filter(tc => tc.id !== id));

        // Delete from filesystem
        deleteArtifact('testcases', id).catch(err =>
            console.error('Failed to delete test case:', err)
        );
    };

    return {
        handleAddTestCase,
        handleUpdateTestCase,
        handleDeleteTestCase,
        handlePermanentDeleteTestCase
    };
}
