import React, { useState, useMemo, useCallback } from 'react';
import { DetailedRequirementView } from '../components';
import { useRequirements, useUI } from '../app/providers';
import { type SortConfig, toggleSort } from '../components/SortableHeader';

export const RequirementsPage: React.FC = () => {
  const { requirements, handleEdit } = useRequirements();
  const { searchQuery, columnVisibility } = useUI();
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'id', direction: 'asc' });

  const handleSortChange = useCallback((key: string) => {
    setSortConfig((prev) => toggleSort(prev, key));
  }, []);

  // Memoize filtered requirements to avoid re-filtering on every render
  const filteredRequirements = useMemo(() => {
    return requirements.filter((req) => {
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
  }, [requirements, searchQuery]);

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
