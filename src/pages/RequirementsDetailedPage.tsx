import React, { useState } from 'react';
import { DetailedRequirementView } from '../components';
import { useRequirements, useUI } from '../app/providers';
import { type SortConfig, toggleSort } from '../components/SortableHeader';

export const RequirementsDetailedPage: React.FC = () => {
  const { requirements, handleEdit } = useRequirements();
  const { searchQuery, columnVisibility } = useUI();
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'id', direction: 'asc' });

  const handleSortChange = (key: string) => {
    setSortConfig(toggleSort(sortConfig, key));
  };

  const filteredRequirements = requirements.filter((req) => {
    if (req.isDeleted) return false;
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      req.id.toLowerCase().includes(query) ||
      req.title.toLowerCase().includes(query) ||
      req.description.toLowerCase().includes(query) ||
      req.text.toLowerCase().includes(query)
    );
  });

  return (
    <DetailedRequirementView
      requirements={filteredRequirements}
      onEdit={handleEdit}
      visibleColumns={columnVisibility}
      sortConfig={sortConfig}
      onSortChange={handleSortChange}
    />
  );
};
