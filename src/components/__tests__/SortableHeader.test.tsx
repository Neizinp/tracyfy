import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SortableHeader, toggleSort, sortItems, SortConfig } from '../SortableHeader';

describe('SortableHeader', () => {
  describe('Component', () => {
    const mockOnSort = vi.fn();

    it('should render header label', () => {
      render(
        <table>
          <thead>
            <tr>
              <SortableHeader label="Name" sortKey="name" onSort={mockOnSort} />
            </tr>
          </thead>
        </table>
      );

      expect(screen.getByText('Name')).toBeInTheDocument();
    });

    it('should call onSort with sortKey when clicked', () => {
      render(
        <table>
          <thead>
            <tr>
              <SortableHeader label="Name" sortKey="name" onSort={mockOnSort} />
            </tr>
          </thead>
        </table>
      );

      fireEvent.click(screen.getByText('Name'));

      expect(mockOnSort).toHaveBeenCalledWith('name');
    });

    it('should show ascending icon when sorted ascending', () => {
      const sortConfig: SortConfig = { key: 'name', direction: 'asc' };
      render(
        <table>
          <thead>
            <tr>
              <SortableHeader
                label="Name"
                sortKey="name"
                currentSort={sortConfig}
                onSort={mockOnSort}
              />
            </tr>
          </thead>
        </table>
      );

      // The chevron-up icon should be visible
      expect(document.querySelector('.lucide-chevron-up')).toBeInTheDocument();
    });

    it('should show descending icon when sorted descending', () => {
      const sortConfig: SortConfig = { key: 'name', direction: 'desc' };
      render(
        <table>
          <thead>
            <tr>
              <SortableHeader
                label="Name"
                sortKey="name"
                currentSort={sortConfig}
                onSort={mockOnSort}
              />
            </tr>
          </thead>
        </table>
      );

      expect(document.querySelector('.lucide-chevron-down')).toBeInTheDocument();
    });

    it('should show neutral icon when not sorted', () => {
      render(
        <table>
          <thead>
            <tr>
              <SortableHeader label="Name" sortKey="name" onSort={mockOnSort} />
            </tr>
          </thead>
        </table>
      );

      expect(document.querySelector('.lucide-chevrons-up-down')).toBeInTheDocument();
    });
  });

  describe('toggleSort', () => {
    it('should set ascending when sorting new column', () => {
      const result = toggleSort(undefined, 'name');

      expect(result).toEqual({ key: 'name', direction: 'asc' });
    });

    it('should toggle to descending when already ascending on same column', () => {
      const result = toggleSort({ key: 'name', direction: 'asc' }, 'name');

      expect(result).toEqual({ key: 'name', direction: 'desc' });
    });

    it('should toggle to ascending when already descending on same column', () => {
      const result = toggleSort({ key: 'name', direction: 'desc' }, 'name');

      expect(result).toEqual({ key: 'name', direction: 'asc' });
    });

    it('should reset to ascending when switching to different column', () => {
      const result = toggleSort({ key: 'name', direction: 'desc' }, 'status');

      expect(result).toEqual({ key: 'status', direction: 'asc' });
    });
  });

  describe('sortItems', () => {
    const items = [
      { id: 'REQ-001', name: 'Zebra', priority: 3 },
      { id: 'REQ-002', name: 'Apple', priority: 1 },
      { id: 'REQ-003', name: 'Banana', priority: 2 },
    ];

    it('should return items unchanged when no sortConfig', () => {
      const result = sortItems(items, undefined);

      expect(result).toEqual(items);
    });

    it('should sort strings ascending', () => {
      const result = sortItems(items, { key: 'name', direction: 'asc' });

      expect(result.map((i) => i.name)).toEqual(['Apple', 'Banana', 'Zebra']);
    });

    it('should sort strings descending', () => {
      const result = sortItems(items, { key: 'name', direction: 'desc' });

      expect(result.map((i) => i.name)).toEqual(['Zebra', 'Banana', 'Apple']);
    });

    it('should sort numbers ascending', () => {
      const result = sortItems(items, { key: 'priority', direction: 'asc' });

      expect(result.map((i) => i.priority)).toEqual([1, 2, 3]);
    });

    it('should sort numbers descending', () => {
      const result = sortItems(items, { key: 'priority', direction: 'desc' });

      expect(result.map((i) => i.priority)).toEqual([3, 2, 1]);
    });

    it('should handle null/undefined values by putting them at end when ascending', () => {
      const itemsWithNull = [
        { id: '1', name: 'Zebra' },
        { id: '2', name: undefined },
        { id: '3', name: 'Apple' },
      ];

      const result = sortItems(itemsWithNull, { key: 'name', direction: 'asc' });

      expect(result.map((i) => i.name)).toEqual(['Apple', 'Zebra', undefined]);
    });

    it('should handle null/undefined values by putting them at start when descending', () => {
      const itemsWithNull = [
        { id: '1', name: 'Zebra' },
        { id: '2', name: undefined },
        { id: '3', name: 'Apple' },
      ];

      const result = sortItems(itemsWithNull, { key: 'name', direction: 'desc' });

      expect(result.map((i) => i.name)).toEqual([undefined, 'Zebra', 'Apple']);
    });

    it('should sort IDs with numeric awareness', () => {
      const itemsWithIds = [{ id: 'REQ-10' }, { id: 'REQ-2' }, { id: 'REQ-1' }];

      const result = sortItems(itemsWithIds, { key: 'id', direction: 'asc' });

      expect(result.map((i) => i.id)).toEqual(['REQ-1', 'REQ-2', 'REQ-10']);
    });

    it('should use custom getValueFn when provided', () => {
      const result = sortItems(items, { key: 'name', direction: 'asc' }, (item) =>
        item.name.toLowerCase()
      );

      expect(result.map((i) => i.name)).toEqual(['Apple', 'Banana', 'Zebra']);
    });

    it('should not mutate original array', () => {
      const original = [...items];
      sortItems(items, { key: 'name', direction: 'asc' });

      expect(items).toEqual(original);
    });
  });
});
