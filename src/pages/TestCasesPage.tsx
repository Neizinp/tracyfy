import React, { useCallback } from 'react';
import { TestCaseList } from '../components';
import { useAppStore } from '../state';
import type { TestCase } from '../types';
import { useArtifactFilteredData } from '../hooks/useArtifactFilteredData';

export const TestCasesPage: React.FC = () => {
  const testCases = useAppStore((s) => s.artifacts.testCase);
  const editArtifact = useAppStore((s) => s.editArtifact);
  const handleEditTestCase = useCallback(
    (item: TestCase) => editArtifact('testCase', item),
    [editArtifact]
  );
  const searchQuery = useAppStore((s) => s.searchQuery);
  const testCaseColumnVisibility = useAppStore((s) => s.columnVisibility.testCase);

  const { sortedData, sortConfig, handleSortChange } = useArtifactFilteredData(testCases, {
    searchQuery,
    searchFields: ['id', 'title', 'description'],
  });

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
