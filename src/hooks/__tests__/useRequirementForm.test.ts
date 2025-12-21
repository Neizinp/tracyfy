/**
 * useRequirementForm Hook Tests
 *
 * Tests for the requirement form hook.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRequirementForm } from '../useRequirementForm';
import type { Requirement } from '../../types';

// Mock the providers
vi.mock('../../app/providers', () => ({
  useUI: () => ({
    columnVisibility: {},
    setColumnVisibility: vi.fn(),
  }),
}));

// Mock useArtifactForm
vi.mock('./useArtifactForm', () => ({
  useArtifactForm: vi.fn(() => ({
    isEditMode: false,
    currentUser: { name: 'Test User' },
    activeTab: 'overview',
    setActiveTab: vi.fn(),
    title: '',
    setTitle: vi.fn(),
    description: '',
    setDescription: vi.fn(),
    text: '',
    setText: vi.fn(),
    priority: 'medium',
    setPriority: vi.fn(),
    status: 'draft',
    setStatus: vi.fn(),
    linkedArtifacts: [],
    setLinkedArtifacts: vi.fn(),
    customAttributes: {},
    setCustomAttributes: vi.fn(),
    handleSubmit: vi.fn(),
    handleRemoveLink: vi.fn(),
    handleDelete: vi.fn(),
    confirmDelete: vi.fn(),
    cancelDelete: vi.fn(),
    showDeleteConfirm: false,
  })),
}));

// Mock useArtifactNavigation
vi.mock('./useArtifactNavigation', () => ({
  useArtifactNavigation: vi.fn(() => vi.fn()),
}));

describe('useRequirementForm', () => {
  const mockOnClose = vi.fn();
  const mockOnCreate = vi.fn();
  const mockOnUpdate = vi.fn();
  const mockOnDelete = vi.fn();

  const defaultOptions = {
    isOpen: true,
    requirement: null,
    onClose: mockOnClose,
    onCreate: mockOnCreate,
    onUpdate: mockOnUpdate,
    onDelete: mockOnDelete,
  };

  const existingRequirement: Requirement = {
    id: 'REQ-001',
    title: 'Existing Requirement',
    description: 'Existing Description',
    text: 'The system shall...',
    author: 'Author Name',
    priority: 'high',
    status: 'approved',
    dateCreated: 1700000000000,
    lastModified: 1700000100000,
    revision: '02',
    rationale: 'Some rationale',
    verificationMethod: 'Test',
    comments: 'Some comments',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Hook initialization', () => {
    it('should return all expected fields and methods', () => {
      const { result } = renderHook(() => useRequirementForm(defaultOptions));

      // Mode
      expect(result.current.isEditMode).toBeDefined();
      expect(result.current.currentUser).toBeDefined();

      // Tab state
      expect(result.current.activeTab).toBeDefined();
      expect(result.current.setActiveTab).toBeDefined();

      // Form fields
      expect(result.current.title).toBeDefined();
      expect(result.current.setTitle).toBeDefined();
      expect(result.current.description).toBeDefined();
      expect(result.current.setDescription).toBeDefined();
      expect(result.current.text).toBeDefined();
      expect(result.current.setText).toBeDefined();
      expect(result.current.priority).toBeDefined();
      expect(result.current.setPriority).toBeDefined();
      expect(result.current.status).toBeDefined();
      expect(result.current.setStatus).toBeDefined();

      // Requirement-specific
      expect(result.current.rationale).toBeDefined();
      expect(result.current.setRationale).toBeDefined();
      expect(result.current.verificationMethod).toBeDefined();
      expect(result.current.setVerificationMethod).toBeDefined();
      expect(result.current.comments).toBeDefined();
      expect(result.current.setComments).toBeDefined();

      // Actions
      expect(result.current.handleSubmit).toBeDefined();
      expect(result.current.handleRemoveLink).toBeDefined();
      expect(result.current.handleDelete).toBeDefined();
    });
  });

  describe('Specialized fields', () => {
    it('should initialize specialized fields to empty when creating new', () => {
      const { result } = renderHook(() => useRequirementForm(defaultOptions));

      expect(result.current.rationale).toBe('');
      expect(result.current.verificationMethod).toBe('');
      expect(result.current.comments).toBe('');
    });

    it('should update rationale field', () => {
      const { result } = renderHook(() => useRequirementForm(defaultOptions));

      act(() => {
        result.current.setRationale('New rationale');
      });

      expect(result.current.rationale).toBe('New rationale');
    });

    it('should update verificationMethod field', () => {
      const { result } = renderHook(() => useRequirementForm(defaultOptions));

      act(() => {
        result.current.setVerificationMethod('Analysis');
      });

      expect(result.current.verificationMethod).toBe('Analysis');
    });

    it('should update comments field', () => {
      const { result } = renderHook(() => useRequirementForm(defaultOptions));

      act(() => {
        result.current.setComments('Review needed');
      });

      expect(result.current.comments).toBe('Review needed');
    });
  });

  describe('Field updates with existing requirement', () => {
    it('should sync specialized fields when requirement changes', () => {
      const { result, rerender } = renderHook((options) => useRequirementForm(options), {
        initialProps: { ...defaultOptions, requirement: null },
      });

      // Initially empty
      expect(result.current.rationale).toBe('');

      // Update to existing requirement
      rerender({ ...defaultOptions, requirement: existingRequirement });

      expect(result.current.rationale).toBe('Some rationale');
      expect(result.current.verificationMethod).toBe('Test');
      expect(result.current.comments).toBe('Some comments');
    });
  });

  describe('Delete confirmation', () => {
    it('should expose delete confirmation state', () => {
      const { result } = renderHook(() => useRequirementForm(defaultOptions));

      expect(result.current.showDeleteConfirm).toBe(false);
      expect(result.current.confirmDelete).toBeDefined();
      expect(result.current.cancelDelete).toBeDefined();
    });
  });
});
