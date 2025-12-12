import React, { useState, useMemo, useCallback } from 'react';
import { InformationList } from '../components';
import { useInformation, useUI } from '../app/providers';
import { type SortConfig, toggleSort } from '../components/SortableHeader';

export const InformationPage: React.FC = () => {
  const { information, handleEditInformation } = useInformation();
  const { searchQuery, informationColumnVisibility } = useUI();
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'id', direction: 'asc' });

  const handleSortChange = useCallback((key: string) => {
    setSortConfig((prev) => toggleSort(prev, key));
  }, []);

  // Memoize filtered information to avoid re-filtering on every render
  const filteredInformation = useMemo(() => {
    return information.filter((info) => {
      if (info.isDeleted) return false;
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        info.id.toLowerCase().includes(query) ||
        info.title.toLowerCase().includes(query) ||
        info.content.toLowerCase().includes(query)
      );
    });
  }, [information, searchQuery]);

  return (
    <InformationList
      information={filteredInformation}
      onEdit={handleEditInformation}
      visibleColumns={informationColumnVisibility}
      sortConfig={sortConfig}
      onSortChange={handleSortChange}
    />
  );
};
