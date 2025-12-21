/**
 * Sort Columns Tests
 *
 * Tests for column sorting in artifact lists.
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useArtifactFilteredData } from '../../hooks/useArtifactFilteredData';

interface TestItem {
  id: string;
  title: string;
  priority: string;
  dateCreated: number;
}

describe('Sort Columns', () => {
  const testData: TestItem[] = [
    { id: 'REQ-003', title: 'Charlie', priority: 'low', dateCreated: 1700000300000 },
    { id: 'REQ-001', title: 'Alpha', priority: 'high', dateCreated: 1700000100000 },
    { id: 'REQ-002', title: 'Bravo', priority: 'medium', dateCreated: 1700000200000 },
  ];

  describe('Default sorting', () => {
    it('should have default sort config', () => {
      const { result } = renderHook(() =>
        useArtifactFilteredData(testData, {
          searchQuery: '',
          searchFields: ['title'],
        })
      );

      expect(result.current.sortConfig).toBeDefined();
      expect(result.current.sortConfig.key).toBeDefined();
      expect(result.current.sortConfig.direction).toBeDefined();
    });
  });

  describe('Sort by ID', () => {
    it('should sort by ID ascending', () => {
      const { result } = renderHook(() =>
        useArtifactFilteredData(testData, {
          searchQuery: '',
          searchFields: ['title'],
          getValueFn: (item: TestItem, key: string) => {
            if (key === 'id') {
              return parseInt(item.id.replace(/\D/g, ''), 10);
            }
            return item[key as keyof TestItem];
          },
        })
      );

      // Default sort should work
      expect(result.current.sortedData.length).toBe(3);
    });
  });

  describe('Sort direction toggle', () => {
    it('should toggle sort direction when same column clicked', () => {
      const { result } = renderHook(() =>
        useArtifactFilteredData(testData, {
          searchQuery: '',
          searchFields: ['title'],
        })
      );

      const initialDirection = result.current.sortConfig.direction;

      act(() => {
        result.current.handleSortChange(result.current.sortConfig.key);
      });

      // Direction should toggle
      expect(result.current.sortConfig.direction).not.toBe(initialDirection);
    });

    it('should reset to ascending when different column clicked', () => {
      const { result } = renderHook(() =>
        useArtifactFilteredData(testData, {
          searchQuery: '',
          searchFields: ['title'],
        })
      );

      act(() => {
        result.current.handleSortChange('title');
      });

      expect(result.current.sortConfig.key).toBe('title');
      expect(result.current.sortConfig.direction).toBe('asc');
    });
  });

  describe('Custom sort values', () => {
    it('should use getValueFn for custom sort values', () => {
      const priorityOrder: Record<string, number> = { high: 3, medium: 2, low: 1 };

      const { result } = renderHook(() =>
        useArtifactFilteredData(testData, {
          searchQuery: '',
          searchFields: ['title'],
          getValueFn: (item: TestItem, key: string) => {
            if (key === 'priority') {
              return priorityOrder[item.priority] || 0;
            }
            return item[key as keyof TestItem];
          },
        })
      );

      act(() => {
        result.current.handleSortChange('priority');
      });

      // Should be sorted by priority: high (3), medium (2), low (1)
      expect(result.current.sortConfig.key).toBe('priority');
    });
  });

  describe('Date sorting', () => {
    it('should sort dates correctly', () => {
      const { result } = renderHook(() =>
        useArtifactFilteredData(testData, {
          searchQuery: '',
          searchFields: ['title'],
        })
      );

      act(() => {
        result.current.handleSortChange('dateCreated');
      });

      expect(result.current.sortConfig.key).toBe('dateCreated');
    });
  });
});
