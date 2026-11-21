import React, { useCallback } from 'react';
import { UseCaseList } from '../components';
import { useAppStore } from '../state';
import type { UseCase } from '../types';
import { useArtifactFilteredData } from '../hooks/useArtifactFilteredData';

export const UseCasesPage: React.FC = () => {
  const useCases = useAppStore((s) => s.artifacts.useCase);
  const editArtifact = useAppStore((s) => s.editArtifact);
  const handleEditUseCase = useCallback(
    (item: UseCase) => editArtifact('useCase', item),
    [editArtifact]
  );
  const searchQuery = useAppStore((s) => s.searchQuery);
  const useCaseColumnVisibility = useAppStore((s) => s.columnVisibility.useCase);

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
