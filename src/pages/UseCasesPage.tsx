import React, { useState } from 'react';
import { UseCaseList } from '../components';
import { useUseCases, useRequirements, useUI } from '../app/providers';
import { type SortConfig, toggleSort } from '../components/SortableHeader';

export const UseCasesPage: React.FC = () => {
  const { useCases, handleEditUseCase } = useUseCases();
  const { requirements } = useRequirements();
  const { searchQuery, useCaseColumnVisibility } = useUI();
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'id', direction: 'asc' });

  const handleSortChange = (key: string) => {
    setSortConfig(toggleSort(sortConfig, key));
  };

  const filteredUseCases = useCases.filter((uc) => {
    if (uc.isDeleted) return false;
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      uc.id.toLowerCase().includes(query) ||
      uc.title.toLowerCase().includes(query) ||
      uc.description.toLowerCase().includes(query) ||
      uc.actor.toLowerCase().includes(query)
    );
  });

  return (
    <UseCaseList
      useCases={filteredUseCases}
      requirements={requirements}
      onEdit={handleEditUseCase}
      visibleColumns={useCaseColumnVisibility}
      sortConfig={sortConfig}
      onSortChange={handleSortChange}
    />
  );
};
