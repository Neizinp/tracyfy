import React, { useState, useMemo, useCallback } from 'react';
import { UseCaseList } from '../components';
import { useUseCases, useRequirements, useUI } from '../app/providers';
import { type SortConfig, toggleSort } from '../components/SortableHeader';

export const UseCasesPage: React.FC = () => {
  const { useCases, handleEditUseCase } = useUseCases();
  const { requirements } = useRequirements();
  const { searchQuery, useCaseColumnVisibility } = useUI();
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'id', direction: 'asc' });

  const handleSortChange = useCallback((key: string) => {
    setSortConfig((prev) => toggleSort(prev, key));
  }, []);

  // Memoize filtered use cases to avoid re-filtering on every render
  const filteredUseCases = useMemo(() => {
    return useCases.filter((uc) => {
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
  }, [useCases, searchQuery]);

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
