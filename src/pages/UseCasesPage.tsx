import React from 'react';
import { UseCaseList } from '../components';
import { useUseCases, useRequirements, useUI } from '../app/providers';
import { useArtifactFilteredData } from '../hooks/useArtifactFilteredData';

export const UseCasesPage: React.FC = () => {
  const { useCases, handleEditUseCase } = useUseCases();
  const { requirements } = useRequirements();
  const { searchQuery, useCaseColumnVisibility } = useUI();

  const { sortedData, sortConfig, handleSortChange } = useArtifactFilteredData(
    useCases,
    searchQuery,
    ['id', 'title', 'description', 'actor']
  );

  return (
    <UseCaseList
      useCases={sortedData}
      requirements={requirements}
      onEdit={handleEditUseCase}
      visibleColumns={useCaseColumnVisibility}
      sortConfig={sortConfig}
      onSortChange={handleSortChange}
    />
  );
};
