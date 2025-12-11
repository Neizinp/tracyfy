import React from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

export type SortDirection = 'asc' | 'desc';

export interface SortConfig<T extends string = string> {
  key: T;
  direction: SortDirection;
}

interface SortableHeaderProps {
  label: string;
  sortKey: string;
  currentSort?: SortConfig;
  onSort: (key: string) => void;
  style?: React.CSSProperties;
}

export const SortableHeader: React.FC<SortableHeaderProps> = ({
  label,
  sortKey,
  currentSort,
  onSort,
  style = {},
}) => {
  const isActive = currentSort?.key === sortKey;
  const direction = isActive ? currentSort.direction : null;

  const handleClick = () => {
    onSort(sortKey);
  };

  return (
    <th
      style={{
        padding: '12px 16px',
        textAlign: 'left',
        fontWeight: 600,
        color: 'var(--color-text-secondary)',
        fontSize: 'var(--font-size-sm)',
        cursor: 'pointer',
        userSelect: 'none',
        ...style,
      }}
      onClick={handleClick}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        <span>{label}</span>
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)',
            opacity: isActive ? 1 : 0.5,
          }}
        >
          {direction === 'asc' && <ChevronUp size={14} />}
          {direction === 'desc' && <ChevronDown size={14} />}
          {!direction && <ChevronsUpDown size={14} />}
        </span>
      </div>
    </th>
  );
};

/**
 * Helper to toggle sort direction or set new sort key
 */
export function toggleSort<T extends string>(
  currentSort: SortConfig<T> | undefined,
  key: T
): SortConfig<T> {
  if (currentSort?.key === key) {
    return {
      key,
      direction: currentSort.direction === 'asc' ? 'desc' : 'asc',
    };
  }
  return { key, direction: 'asc' };
}

/**
 * Generic sort function for artifacts
 */
export function sortItems<T>(
  items: T[],
  sortConfig: SortConfig | undefined,
  getValueFn?: (item: T, key: string) => string | number | undefined
): T[] {
  if (!sortConfig) return items;

  return [...items].sort((a, b) => {
    let aVal: string | number | undefined;
    let bVal: string | number | undefined;

    if (getValueFn) {
      aVal = getValueFn(a, sortConfig.key);
      bVal = getValueFn(b, sortConfig.key);
    } else {
      aVal = (a as Record<string, unknown>)[sortConfig.key] as string | number | undefined;
      bVal = (b as Record<string, unknown>)[sortConfig.key] as string | number | undefined;
    }

    // Handle nullish values
    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return sortConfig.direction === 'asc' ? 1 : -1;
    if (bVal == null) return sortConfig.direction === 'asc' ? -1 : 1;

    // Compare values
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      const cmp = aVal.localeCompare(bVal, undefined, { numeric: true, sensitivity: 'base' });
      return sortConfig.direction === 'asc' ? cmp : -cmp;
    }

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
    }

    // Fallback: convert to string
    const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
    return sortConfig.direction === 'asc' ? cmp : -cmp;
  });
}
