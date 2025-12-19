import { useMemo, useState, useCallback } from 'react';
import { type SortConfig, toggleSort, sortItems } from '../components/SortableHeader';

interface Identifiable {
  id: string;
  isDeleted?: boolean;
}

export function useArtifactFilteredData<T extends Identifiable>(
  items: T[],
  searchQuery: string,
  searchFields: (keyof T)[] = ['id' as keyof T]
) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'id', direction: 'asc' });

  const handleSortChange = useCallback((key: string) => {
    setSortConfig((prev) => toggleSort(prev, key));
  }, []);

  const filteredData = useMemo(() => {
    return items.filter((item) => {
      if (item.isDeleted) return false;
      if (!searchQuery) return true;

      const query = searchQuery.toLowerCase();
      return searchFields.some((field) => {
        const value = item[field];
        if (typeof value === 'string') {
          return value.toLowerCase().includes(query);
        }
        return false;
      });
    });
  }, [items, searchQuery, searchFields]);

  const sortedData = useMemo(() => {
    return sortItems(filteredData, sortConfig);
  }, [filteredData, sortConfig]);

  return {
    filteredData,
    sortedData,
    sortConfig,
    handleSortChange,
  };
}
