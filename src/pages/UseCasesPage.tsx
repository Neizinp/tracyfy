import React, { useState } from 'react';
import { UseCaseList } from '../components';
import { GenericColumnSelector } from '../components/GenericColumnSelector';
import { useUseCases, useRequirements, useUI } from '../app/providers';
import type { UseCaseColumnVisibility } from '../types';

const defaultColumns: UseCaseColumnVisibility = {
  idTitle: true,
  description: true,
  actor: true,
  priority: true,
  status: true,
  preconditions: false,
  mainFlow: false,
  alternativeFlows: false,
  postconditions: false,
};

const columnConfig: {
  key: keyof UseCaseColumnVisibility;
  label: string;
  alwaysVisible?: boolean;
}[] = [
  { key: 'idTitle', label: 'ID / Title', alwaysVisible: true },
  { key: 'description', label: 'Description' },
  { key: 'actor', label: 'Actor' },
  { key: 'priority', label: 'Priority' },
  { key: 'status', label: 'Status' },
  { key: 'preconditions', label: 'Preconditions' },
  { key: 'mainFlow', label: 'Main Flow' },
  { key: 'alternativeFlows', label: 'Alt. Flows' },
  { key: 'postconditions', label: 'Postconditions' },
];

export const UseCasesPage: React.FC = () => {
  const { useCases, handleEditUseCase } = useUseCases();
  const { requirements } = useRequirements();
  const { searchQuery } = useUI();
  const [visibleColumns, setVisibleColumns] = useState<UseCaseColumnVisibility>(defaultColumns);

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <GenericColumnSelector
          columns={columnConfig}
          visibleColumns={visibleColumns}
          onColumnVisibilityChange={setVisibleColumns}
        />
      </div>
      <UseCaseList
        useCases={filteredUseCases}
        requirements={requirements}
        onEdit={handleEditUseCase}
        visibleColumns={visibleColumns}
      />
    </div>
  );
};
