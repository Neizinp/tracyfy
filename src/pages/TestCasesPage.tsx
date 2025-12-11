import React, { useState } from 'react';
import { TestCaseList } from '../components';
import { useTestCases, useUI } from '../app/providers';
import { type SortConfig, toggleSort } from '../components/SortableHeader';

export const TestCasesPage: React.FC = () => {
  const { testCases, handleEditTestCase } = useTestCases();
  const { searchQuery, testCaseColumnVisibility } = useUI();
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'id', direction: 'asc' });

  const handleSortChange = (key: string) => {
    setSortConfig(toggleSort(sortConfig, key));
  };

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
      sortConfig={sortConfig}
      onSortChange={handleSortChange}
    />
  );
};
