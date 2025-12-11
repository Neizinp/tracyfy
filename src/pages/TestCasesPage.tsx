import React, { useState } from 'react';
import { TestCaseList } from '../components';
import { GenericColumnSelector } from '../components/GenericColumnSelector';
import { useTestCases, useUI } from '../app/providers';
import type { TestCaseColumnVisibility } from '../types';

const defaultColumns: TestCaseColumnVisibility = {
  idTitle: true,
  description: true,
  requirements: true,
  priority: true,
  status: true,
  author: false,
  lastRun: true,
  created: false,
};

const columnConfig: {
  key: keyof TestCaseColumnVisibility;
  label: string;
  alwaysVisible?: boolean;
}[] = [
  { key: 'idTitle', label: 'ID / Title', alwaysVisible: true },
  { key: 'description', label: 'Description' },
  { key: 'requirements', label: 'Requirements' },
  { key: 'priority', label: 'Priority' },
  { key: 'status', label: 'Status' },
  { key: 'author', label: 'Author' },
  { key: 'lastRun', label: 'Last Run' },
  { key: 'created', label: 'Created' },
];

export const TestCasesPage: React.FC = () => {
  const { testCases, handleEditTestCase } = useTestCases();
  const { searchQuery } = useUI();
  const [visibleColumns, setVisibleColumns] = useState<TestCaseColumnVisibility>(defaultColumns);

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <GenericColumnSelector
          columns={columnConfig}
          visibleColumns={visibleColumns}
          onColumnVisibilityChange={setVisibleColumns}
        />
      </div>
      <TestCaseList
        testCases={filteredTestCases}
        onEdit={handleEditTestCase}
        visibleColumns={visibleColumns}
      />
    </div>
  );
};
