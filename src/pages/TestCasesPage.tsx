import React from 'react';
import { TestCaseList } from '../components';
import { useTestCases, useUI } from '../app/providers';
import { useArtifactFilteredData } from '../hooks/useArtifactFilteredData';

export const TestCasesPage: React.FC = () => {
  const { testCases, handleEditTestCase } = useTestCases();
  const { searchQuery, testCaseColumnVisibility } = useUI();

  const { sortedData, sortConfig, handleSortChange } = useArtifactFilteredData(
    testCases,
    searchQuery,
    ['id', 'title', 'description']
  );

  return (
    <TestCaseList
      testCases={sortedData}
      onEdit={handleEditTestCase}
      visibleColumns={testCaseColumnVisibility}
      sortConfig={sortConfig}
      onSortChange={handleSortChange}
    />
  );
};
