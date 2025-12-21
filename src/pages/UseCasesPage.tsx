import React from 'react';
import { UseCaseList } from '../components';
import { useUseCases, useUI } from '../app/providers';
import { useArtifactFilteredData } from '../hooks/useArtifactFilteredData';

export const UseCasesPage: React.FC = () => {
  const { useCases, handleEditUseCase } = useUseCases();
  const { searchQuery, useCaseColumnVisibility } = useUI();

  const { sortedData, sortConfig, handleSortChange } = useArtifactFilteredData(useCases, {
    searchQuery,
    searchFields: ['id', 'title', 'description', 'actor'],
  });

  return (
    <UseCaseList
      useCases={sortedData}
      onEdit={handleEditUseCase}
      visibleColumns={useCaseColumnVisibility}
      sortConfig={sortConfig}
      onSortChange={handleSortChange}
    />
  );
};
