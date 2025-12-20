import { useMemo, useState, useCallback } from 'react';
import { type SortConfig, toggleSort, sortItems } from '../components/SortableHeader';

interface Identifiable {
  id: string;
  isDeleted?: boolean;
}

export interface FilterOptions<T> {
  searchQuery: string;
  searchFields?: (keyof T)[];
  filterFn?: (item: T) => boolean;
  getValueFn?: (item: T, key: string) => string | number | undefined;
  initialSort?: SortConfig;
}

export function useArtifactFilteredData<T extends Identifiable>(
  items: T[],
  optionsOrQuery: string | FilterOptions<T>,
  searchFieldsLegacy: (keyof T)[] = ['id' as keyof T]
) {
  const isOptions = typeof optionsOrQuery !== 'string';
  const searchQuery = isOptions ? optionsOrQuery.searchQuery : optionsOrQuery;
  const filterFn = isOptions ? optionsOrQuery.filterFn : undefined;
  const getValueFn = isOptions ? optionsOrQuery.getValueFn : undefined;
  const initialSort = isOptions ? optionsOrQuery.initialSort : undefined;

  const [sortConfig, setSortConfig] = useState<SortConfig>(
    initialSort || { key: 'id', direction: 'asc' }
  );

  const handleSortChange = useCallback((key: string) => {
    setSortConfig((prev) => toggleSort(prev, key));
  }, []);

  const filteredData = useMemo(() => {
    const fields = isOptions
      ? optionsOrQuery.searchFields || (['id'] as (keyof T)[])
      : searchFieldsLegacy;

    return items.filter((item) => {
      // Basic deleted filter
      if (item.isDeleted) return false;

      // Custom filter
      if (filterFn && !filterFn(item)) return false;

      if (!searchQuery) return true;

      const query = searchQuery.toLowerCase();
      return fields.some((field) => {
        const value = item[field];
        if (typeof value === 'string') {
          return value.toLowerCase().includes(query);
        }
        return false;
      });
    });
  }, [items, searchQuery, optionsOrQuery, searchFieldsLegacy, filterFn, isOptions]);

  const sortedData = useMemo(() => {
    return sortItems(filteredData, sortConfig, getValueFn);
  }, [filteredData, sortConfig, getValueFn]);

  return {
    filteredData,
    sortedData,
    sortConfig,
    setSortConfig,
    handleSortChange,
  };
}
