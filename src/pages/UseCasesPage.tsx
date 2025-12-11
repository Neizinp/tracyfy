import React from 'react';
import { UseCaseList } from '../components';
import { useUseCases, useRequirements, useUI } from '../app/providers';

export const UseCasesPage: React.FC = () => {
  const { useCases, handleEditUseCase } = useUseCases();
  const { requirements } = useRequirements();
  const { searchQuery, useCaseColumnVisibility } = useUI();

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
    />
  );
};
