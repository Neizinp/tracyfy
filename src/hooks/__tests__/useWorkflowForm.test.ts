/**
 * useWorkflowForm Hook Tests
 *
 * Tests for the workflow form hook.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWorkflowForm } from '../useWorkflowForm';
import type { Workflow } from '../../types';

// Mock all providers used by the workflow form
vi.mock('../../app/providers', () => ({
  useUser: () => ({ currentUser: { name: 'Test User' }, users: [] }),
  useRequirements: () => ({ requirements: [] }),
  useUseCases: () => ({ useCases: [] }),
  useTestCases: () => ({ testCases: [] }),
  useInformation: () => ({ information: [] }),
  useRisks: () => ({ risks: [] }),
}));

// Mock diskWorkflowService
vi.mock('../../services/diskWorkflowService', () => ({
  diskWorkflowService: {
    save: vi.fn(),
    subscribe: vi.fn(() => () => {}),
  },
}));

describe('useWorkflowForm', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  const defaultOptions = {
    isOpen: true,
    workflow: null,
    onClose: mockOnClose,
    onSuccess: mockOnSuccess,
  };

  const existingWorkflow: Workflow = {
    id: 'WF-001',
    title: 'Approval Workflow',
    description: 'Workflow for requirement approval',
    status: 'active',
    type: 'approval',
    artifactIds: ['REQ-001', 'REQ-002'],
    assignedTo: 'Approver Name',
    dateCreated: 1700000000000,
    lastModified: 1700000100000,
    revision: '01',
    approvalStatus: 'pending',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Hook initialization', () => {
    it('should return all expected fields and methods', () => {
      const { result } = renderHook(() => useWorkflowForm(defaultOptions));

      // Form fields
      expect(result.current.title).toBeDefined();
      expect(result.current.setTitle).toBeDefined();
      expect(result.current.description).toBeDefined();
      expect(result.current.setDescription).toBeDefined();
      expect(result.current.type).toBeDefined();
      expect(result.current.setType).toBeDefined();
      expect(result.current.assignedTo).toBeDefined();
      expect(result.current.setAssignedTo).toBeDefined();

      // Actions
      expect(result.current.handleSubmit).toBeDefined();
    });
  });

  describe('Form fields', () => {
    it('should initialize with default values when creating new', () => {
      const { result } = renderHook(() => useWorkflowForm(defaultOptions));

      expect(result.current.title).toBe('');
      expect(result.current.description).toBe('');
      expect(result.current.type).toBe('approval');
    });

    it('should update title field', () => {
      const { result } = renderHook(() => useWorkflowForm(defaultOptions));

      act(() => {
        result.current.setTitle('Review Workflow');
      });

      expect(result.current.title).toBe('Review Workflow');
    });

    it('should update description field', () => {
      const { result } = renderHook(() => useWorkflowForm(defaultOptions));

      act(() => {
        result.current.setDescription('Workflow for reviewing documents');
      });

      expect(result.current.description).toBe('Workflow for reviewing documents');
    });

    it('should update type field', () => {
      const { result } = renderHook(() => useWorkflowForm(defaultOptions));

      act(() => {
        result.current.setType('review');
      });

      expect(result.current.type).toBe('review');
    });

    it('should update assignedTo field', () => {
      const { result } = renderHook(() => useWorkflowForm(defaultOptions));

      act(() => {
        result.current.setAssignedTo('John Doe');
      });

      expect(result.current.assignedTo).toBe('John Doe');
    });
  });

  describe('Field updates with existing workflow', () => {
    it('should sync fields when workflow changes', () => {
      const { result, rerender } = renderHook((options) => useWorkflowForm(options), {
        initialProps: { ...defaultOptions, workflow: null },
      });

      // Initially empty
      expect(result.current.title).toBe('');

      // Update to existing workflow
      rerender({ ...defaultOptions, workflow: existingWorkflow });

      expect(result.current.title).toBe('Approval Workflow');
      expect(result.current.description).toBe('Workflow for requirement approval');
      expect(result.current.type).toBe('approval');
      expect(result.current.assignedTo).toBe('Approver Name');
    });
  });

  describe('Available artifacts', () => {
    it('should expose availableArtifacts for selection', () => {
      const { result } = renderHook(() => useWorkflowForm(defaultOptions));

      expect(result.current.availableArtifacts).toBeDefined();
      expect(Array.isArray(result.current.availableArtifacts)).toBe(true);
    });
  });

  describe('Selected artifact IDs', () => {
    it('should expose selectedArtifactIds', () => {
      const { result } = renderHook(() => useWorkflowForm(defaultOptions));

      expect(result.current.selectedArtifactIds).toBeDefined();
      expect(Array.isArray(result.current.selectedArtifactIds)).toBe(true);
    });

    it('should update selected artifact IDs', () => {
      const { result } = renderHook(() => useWorkflowForm(defaultOptions));

      act(() => {
        result.current.setSelectedArtifactIds(['REQ-001', 'UC-001']);
      });

      expect(result.current.selectedArtifactIds).toEqual(['REQ-001', 'UC-001']);
    });
  });
});
