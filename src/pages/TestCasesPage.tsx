import React from 'react';
import { TestCaseList } from '../components';
import type { TestCase } from '../types';

interface TestCasesPageProps {
    testCases: TestCase[];
    onEdit: (tc: TestCase) => void;
    onDelete: (id: string) => void;
}

export const TestCasesPage: React.FC<TestCasesPageProps> = ({
    testCases,
    onEdit,
    onDelete
}) => {
    return (
        <TestCaseList
            testCases={testCases.filter(tc => !tc.isDeleted)}
            onEdit={onEdit}
            onDelete={onDelete}
        />
    );
};
