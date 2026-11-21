import React, { useCallback } from 'react';
import { RequirementList } from '../components';
import { useAppStore } from '../state';
import type { Requirement } from '../types';
import { useArtifactFilteredData } from '../hooks/useArtifactFilteredData';

export const RequirementsPage: React.FC = () => {
  const requirements = useAppStore((s) => s.artifacts.requirement);
  const editArtifact = useAppStore((s) => s.editArtifact);
  const handleEdit = useCallback(
    (item: Requirement) => editArtifact('requirement', item),
    [editArtifact]
  );
  const searchQuery = useAppStore((s) => s.searchQuery);
  const columnVisibility = useAppStore((s) => s.columnVisibility.requirement);

  const { sortedData, sortConfig, handleSortChange } = useArtifactFilteredData(requirements, {
    searchQuery,
    searchFields: ['id', 'title', 'description', 'text'],
  });

  return (
    <RequirementList
      requirements={sortedData}
      onEdit={handleEdit}
      visibleColumns={columnVisibility}
      sortConfig={sortConfig}
      onSortChange={handleSortChange}
    />
  );
};
