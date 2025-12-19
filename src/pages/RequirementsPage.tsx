import React from 'react';
import { RequirementList } from '../components';
import { useRequirements, useUI } from '../app/providers';
import { useArtifactFilteredData } from '../hooks/useArtifactFilteredData';

export const RequirementsPage: React.FC = () => {
  const { requirements, handleEdit } = useRequirements();
  const { searchQuery, columnVisibility } = useUI();

  const { sortedData, sortConfig, handleSortChange } = useArtifactFilteredData(
    requirements,
    searchQuery,
    ['id', 'title', 'description', 'text']
  );

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
