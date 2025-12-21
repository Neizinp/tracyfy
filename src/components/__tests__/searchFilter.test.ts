/**
 * Search Filter Tests
 *
 * Tests for search filtering in artifact lists.
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useArtifactFilteredData } from '../../hooks/useArtifactFilteredData';

interface TestItem {
  id: string;
  title: string;
  description: string;
  status: string;
  isDeleted?: boolean;
}

describe('Search Filter', () => {
  const testData: TestItem[] = [
    { id: 'REQ-001', title: 'Login Feature', description: 'User authentication', status: 'draft' },
    { id: 'REQ-002', title: 'Dashboard', description: 'Main dashboard view', status: 'approved' },
    { id: 'REQ-003', title: 'Settings Page', description: 'User settings', status: 'draft' },
    { id: 'REQ-004', title: 'Profile', description: 'User profile management', status: 'approved' },
  ];

  describe('Basic filtering', () => {
    it('should return all items when no search query', () => {
      const { result } = renderHook(() =>
        useArtifactFilteredData(testData, {
          searchQuery: '',
          searchFields: ['title', 'description'],
        })
      );

      expect(result.current.sortedData.length).toBe(4);
    });

    it('should filter by title', () => {
      const { result } = renderHook(() =>
        useArtifactFilteredData(testData, {
          searchQuery: 'Login',
          searchFields: ['title', 'description'],
        })
      );

      expect(result.current.sortedData.length).toBe(1);
      expect(result.current.sortedData[0].id).toBe('REQ-001');
    });

    it('should filter by description', () => {
      const { result } = renderHook(() =>
        useArtifactFilteredData(testData, {
          searchQuery: 'dashboard',
          searchFields: ['title', 'description'],
        })
      );

      expect(result.current.sortedData.length).toBe(1);
      expect(result.current.sortedData[0].id).toBe('REQ-002');
    });

    it('should filter by ID', () => {
      const { result } = renderHook(() =>
        useArtifactFilteredData(testData, {
          searchQuery: 'REQ-003',
          searchFields: ['id', 'title', 'description'],
        })
      );

      expect(result.current.sortedData.length).toBe(1);
      expect(result.current.sortedData[0].id).toBe('REQ-003');
    });
  });

  describe('Case insensitivity', () => {
    it('should be case insensitive', () => {
      const { result } = renderHook(() =>
        useArtifactFilteredData(testData, {
          searchQuery: 'LOGIN',
          searchFields: ['title'],
        })
      );

      expect(result.current.sortedData.length).toBe(1);
    });
  });

  describe('Partial matching', () => {
    it('should match partial strings', () => {
      const { result } = renderHook(() =>
        useArtifactFilteredData(testData, {
          searchQuery: 'user',
          searchFields: ['title', 'description'],
        })
      );

      // Should match: Login (User auth), Settings (User settings), Profile (User profile)
      expect(result.current.sortedData.length).toBe(3);
    });
  });

  describe('Custom filter function', () => {
    it('should apply custom filterFn', () => {
      const { result } = renderHook(() =>
        useArtifactFilteredData(testData, {
          searchQuery: '',
          searchFields: ['title'],
          filterFn: (item: TestItem) => item.status === 'approved',
        })
      );

      expect(result.current.sortedData.length).toBe(2);
      expect(result.current.sortedData.every((item) => item.status === 'approved')).toBe(true);
    });

    it('should combine search and custom filter', () => {
      const { result } = renderHook(() =>
        useArtifactFilteredData(testData, {
          searchQuery: 'user',
          searchFields: ['description'],
          filterFn: (item: TestItem) => item.status === 'approved',
        })
      );

      // User in description AND status === approved
      expect(result.current.sortedData.length).toBe(1);
      expect(result.current.sortedData[0].id).toBe('REQ-004');
    });
  });

  describe('Deleted items filtering', () => {
    it('should filter out deleted items by default', () => {
      const dataWithDeleted: TestItem[] = [
        ...testData,
        {
          id: 'REQ-005',
          title: 'Deleted Item',
          description: 'Should not appear',
          status: 'draft',
          isDeleted: true,
        },
      ];

      const { result } = renderHook(() =>
        useArtifactFilteredData(dataWithDeleted, {
          searchQuery: '',
          searchFields: ['title'],
        })
      );

      expect(result.current.sortedData.length).toBe(4);
      expect(result.current.sortedData.find((item) => item.id === 'REQ-005')).toBeUndefined();
    });
  });
});
