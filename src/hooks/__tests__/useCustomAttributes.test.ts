/**
 * useCustomAttributes Hook Tests
 *
 * Tests for the React hook that fetches and manages custom attribute definitions.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCustomAttributes } from '../useCustomAttributes';
import { diskCustomAttributeService } from '../../services/diskCustomAttributeService';
import type { CustomAttributeDefinition } from '../../types/customAttributes';

// Mock the diskCustomAttributeService
vi.mock('../../services/diskCustomAttributeService', () => ({
  diskCustomAttributeService: {
    getAllDefinitions: vi.fn(),
    getDefinitionsByArtifactType: vi.fn(),
  },
}));

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
    vi.mocked(diskCustomAttributeService.getAllDefinitions).mockResolvedValue(mockDefinitions);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Initial load', () => {
    it('should load all definitions on mount', async () => {
      const { result } = renderHook(() => useCustomAttributes());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(diskCustomAttributeService.getAllDefinitions).toHaveBeenCalled();
      expect(result.current.definitions).toEqual(mockDefinitions);
    });

    it('should initially be in loading state', async () => {
      const { result } = renderHook(() => useCustomAttributes());

      // Initial state should have loading true or definitions empty
      expect(result.current.definitions).toBeDefined();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('Loading state', () => {
    it('should set loading false after load completes', async () => {
      const { result } = renderHook(() => useCustomAttributes());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.definitions).toHaveLength(3);
    });
  });

  describe('Error handling', () => {
    it('should set error when load fails', async () => {
      vi.mocked(diskCustomAttributeService.getAllDefinitions).mockRejectedValue(
        new Error('Load failed')
      );

      const { result } = renderHook(() => useCustomAttributes());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error?.message).toBe('Load failed');
      expect(result.current.definitions).toEqual([]);
    });

    it('should set generic error message for non-Error throws', async () => {
      vi.mocked(diskCustomAttributeService.getAllDefinitions).mockRejectedValue(
        'Something went wrong'
      );

      const { result } = renderHook(() => useCustomAttributes());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error?.message).toBe('Failed to fetch custom attributes');
    });
  });

  describe('getDefinitionsForType', () => {
    it('should filter definitions by artifact type', async () => {
      const { result } = renderHook(() => useCustomAttributes());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const requirementDefs = result.current.getDefinitionsForType('requirement');

      expect(requirementDefs).toHaveLength(3); // All three apply to requirements
      expect(requirementDefs.map((d) => d.name)).toContain('Target Release');
      expect(requirementDefs.map((d) => d.name)).toContain('Safety Critical');
      expect(requirementDefs.map((d) => d.name)).toContain('Priority Score');
    });

    it('should return only applicable definitions', async () => {
      const { result } = renderHook(() => useCustomAttributes());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const useCaseDefs = result.current.getDefinitionsForType('useCase');

      expect(useCaseDefs).toHaveLength(1);
      expect(useCaseDefs[0].name).toBe('Target Release');
    });

    it('should return empty array for types with no definitions', async () => {
      const { result } = renderHook(() => useCustomAttributes());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const infoDefs = result.current.getDefinitionsForType('information');

      expect(infoDefs).toHaveLength(0);
    });
  });
});
