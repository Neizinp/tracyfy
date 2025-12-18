/**
 * useCustomAttributes Hook Tests
 *
 * Tests for the React hook that fetches and manages custom attribute definitions.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { CustomAttributeDefinition } from '../../types/customAttributes';

// Mock the context that the hook depends on
const mockGetDefinitionsForType = vi.fn();
const mockRefetch = vi.fn();

let mockContextValue = {
  definitions: [] as CustomAttributeDefinition[],
  loading: true,
  error: null as Error | null,
  refetch: mockRefetch,
  getDefinitionsForType: mockGetDefinitionsForType,
};

vi.mock('../../app/providers/CustomAttributeProvider', () => ({
  useCustomAttributeContext: () => mockContextValue,
}));

// Now import the hook after the mock is set up
import { useCustomAttributes } from '../useCustomAttributes';

describe('useCustomAttributes', () => {
  const mockDefinitions: CustomAttributeDefinition[] = [
    {
      id: 'ATTR-001',
      name: 'Target Release',
      type: 'dropdown',
      description: 'Target release version',
      options: ['v1.0', 'v1.1', 'v2.0'],
      appliesTo: ['requirement', 'useCase'],
      required: false,
      dateCreated: 1700000000000,
      lastModified: 1700000000000,
    },
    {
      id: 'ATTR-002',
      name: 'Safety Critical',
      type: 'checkbox',
      description: '',
      appliesTo: ['requirement', 'testCase'],
      required: true,
      dateCreated: 1700000000000,
      lastModified: 1700000000000,
    },
    {
      id: 'ATTR-003',
      name: 'Priority Score',
      type: 'number',
      description: 'Numeric priority',
      appliesTo: ['requirement'],
      required: false,
      dateCreated: 1700000000000,
      lastModified: 1700000000000,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock context to default loaded state
    mockContextValue = {
      definitions: mockDefinitions,
      loading: false,
      error: null,
      refetch: mockRefetch,
      getDefinitionsForType: mockGetDefinitionsForType,
    };
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Initial load', () => {
    it('should load all definitions on mount', async () => {
      const { result } = renderHook(() => useCustomAttributes());

      expect(result.current.loading).toBe(false);
      expect(result.current.definitions).toEqual(mockDefinitions);
    });

    it('should initially be in loading state', async () => {
      // Set loading state
      mockContextValue = {
        ...mockContextValue,
        loading: true,
        definitions: [],
      };

      const { result } = renderHook(() => useCustomAttributes());

      expect(result.current.loading).toBe(true);
      expect(result.current.definitions).toBeDefined();
    });
  });

  describe('Loading state', () => {
    it('should set loading false after load completes', async () => {
      const { result } = renderHook(() => useCustomAttributes());

      expect(result.current.loading).toBe(false);
      expect(result.current.definitions).toHaveLength(3);
    });
  });

  describe('Error handling', () => {
    it('should set error when load fails', async () => {
      mockContextValue = {
        ...mockContextValue,
        loading: false,
        error: new Error('Load failed'),
        definitions: [],
      };

      const { result } = renderHook(() => useCustomAttributes());

      expect(result.current.loading).toBe(false);
      expect(result.current.error?.message).toBe('Load failed');
      expect(result.current.definitions).toEqual([]);
    });

    it('should set generic error message for non-Error throws', async () => {
      mockContextValue = {
        ...mockContextValue,
        loading: false,
        error: new Error('Failed to fetch custom attributes'),
        definitions: [],
      };

      const { result } = renderHook(() => useCustomAttributes());

      expect(result.current.loading).toBe(false);
      expect(result.current.error?.message).toBe('Failed to fetch custom attributes');
    });
  });

  describe('getDefinitionsForType', () => {
    it('should filter definitions by artifact type', async () => {
      mockGetDefinitionsForType.mockReturnValue(mockDefinitions);

      const { result } = renderHook(() => useCustomAttributes());

      expect(result.current.loading).toBe(false);

      result.current.getDefinitionsForType('requirement');

      expect(mockGetDefinitionsForType).toHaveBeenCalledWith('requirement');
    });

    it('should return only applicable definitions', async () => {
      const useCaseDefs = [mockDefinitions[0]]; // Only Target Release applies to useCase
      mockGetDefinitionsForType.mockReturnValue(useCaseDefs);

      const { result } = renderHook(() => useCustomAttributes());

      expect(result.current.loading).toBe(false);

      result.current.getDefinitionsForType('useCase');

      expect(mockGetDefinitionsForType).toHaveBeenCalledWith('useCase');
    });

    it('should return empty array for types with no definitions', async () => {
      mockGetDefinitionsForType.mockReturnValue([]);

      const { result } = renderHook(() => useCustomAttributes());

      expect(result.current.loading).toBe(false);

      result.current.getDefinitionsForType('information');

      expect(mockGetDefinitionsForType).toHaveBeenCalledWith('information');
    });
  });
});
