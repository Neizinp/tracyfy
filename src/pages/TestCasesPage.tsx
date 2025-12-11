import React from 'react';
import { TestCaseList } from '../components';
import { useTestCases, useUI } from '../app/providers';

export const TestCasesPage: React.FC = () => {
  const { testCases, handleEditTestCase } = useTestCases();
  const { searchQuery, testCaseColumnVisibility } = useUI();

  const filteredTestCases = testCases.filter((tc) => {
    if (tc.isDeleted) return false;
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      tc.id.toLowerCase().includes(query) ||
      tc.title.toLowerCase().includes(query) ||
      tc.description.toLowerCase().includes(query)
    );
  });

  return (
    <TestCaseList
      testCases={filteredTestCases}
      onEdit={handleEditTestCase}
      visibleColumns={testCaseColumnVisibility}
    />
  );
};
