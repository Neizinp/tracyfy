import React from 'react';
import { TestCaseList } from '../components';
import { useTestCases } from '../app/providers';

export const TestCasesPage: React.FC = () => {
  const { testCases, handleEditTestCase } = useTestCases();

  return (
    <TestCaseList testCases={testCases.filter((tc) => !tc.isDeleted)} onEdit={handleEditTestCase} />
  );
};
