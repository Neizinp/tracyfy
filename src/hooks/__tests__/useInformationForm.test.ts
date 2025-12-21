/**
 * useInformationForm Hook Tests
 *
 * Tests for the information form hook.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useInformationForm } from '../useInformationForm';
import type { Information } from '../../types';

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
    activeTab: 'content',
    setActiveTab: vi.fn(),
    title: '',
    setTitle: vi.fn(),
    text: '',
    setText: vi.fn(),
    status: 'draft',
    setStatus: vi.fn(),
    currentUser: { name: 'Test User' },
    linkedArtifacts: [],
    setLinkedArtifacts: vi.fn(),
    customAttributes: {},
    setCustomAttributes: vi.fn(),
    handleSubmit: vi.fn(),
    handleDelete: vi.fn(),
    confirmDelete: vi.fn(),
    cancelDelete: vi.fn(),
    showDeleteConfirm: false,
    handleRemoveLink: vi.fn(),
  })),
}));

// Mock useArtifactNavigation
vi.mock('./useArtifactNavigation', () => ({
  useArtifactNavigation: vi.fn(() => vi.fn()),
}));

describe('useInformationForm', () => {
  const mockOnClose = vi.fn();
  const mockOnCreate = vi.fn();
  const mockOnUpdate = vi.fn();
  const mockOnDelete = vi.fn();

  const defaultOptions = {
    isOpen: true,
    information: null,
    onClose: mockOnClose,
    onCreate: mockOnCreate,
    onUpdate: mockOnUpdate,
    onDelete: mockOnDelete,
  };

  const existingInformation: Information = {
    id: 'INFO-001',
    title: 'Existing Information',
    content: 'Information content',
    type: 'note',
    category: 'Technical',
    author: 'Author Name',
    status: 'approved',
    dateCreated: 1700000000000,
    lastModified: 1700000100000,
    revision: '01',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Hook initialization', () => {
    it('should return all expected fields and methods', () => {
      const { result } = renderHook(() => useInformationForm(defaultOptions));

      // Mode
      expect(result.current.isEditMode).toBeDefined();

      // Tab state
      expect(result.current.activeTab).toBeDefined();
      expect(result.current.setActiveTab).toBeDefined();

      // Form fields
      expect(result.current.title).toBeDefined();
      expect(result.current.setTitle).toBeDefined();
      expect(result.current.content).toBeDefined();
      expect(result.current.setContent).toBeDefined();
      expect(result.current.status).toBeDefined();
      expect(result.current.setStatus).toBeDefined();

      // Information-specific
      expect(result.current.type).toBeDefined();
      expect(result.current.setType).toBeDefined();
      expect(result.current.category).toBeDefined();
      expect(result.current.setCategory).toBeDefined();

      // Actions
      expect(result.current.handleSubmit).toBeDefined();
      expect(result.current.handleDelete).toBeDefined();
    });
  });

  describe('Specialized fields', () => {
    it('should initialize specialized fields with defaults when creating new', () => {
      const { result } = renderHook(() => useInformationForm(defaultOptions));

      expect(result.current.content).toBe('');
      expect(result.current.type).toBe('note');
      expect(result.current.category).toBe('');
    });

    it('should update content field', () => {
      const { result } = renderHook(() => useInformationForm(defaultOptions));

      act(() => {
        result.current.setContent('New content');
      });

      expect(result.current.content).toBe('New content');
    });

    it('should update type field', () => {
      const { result } = renderHook(() => useInformationForm(defaultOptions));

      act(() => {
        result.current.setType('reference');
      });

      expect(result.current.type).toBe('reference');
    });

    it('should update category field', () => {
      const { result } = renderHook(() => useInformationForm(defaultOptions));

      act(() => {
        result.current.setCategory('Design');
      });

      expect(result.current.category).toBe('Design');
    });
  });

  describe('Field updates with existing information', () => {
    it('should sync specialized fields when information changes', () => {
      const { result, rerender } = renderHook((options) => useInformationForm(options), {
        initialProps: { ...defaultOptions, information: null },
      });

      // Initially defaults
      expect(result.current.content).toBe('');
      expect(result.current.type).toBe('note');

      // Update to existing information
      rerender({ ...defaultOptions, information: existingInformation });

      expect(result.current.content).toBe('Information content');
      expect(result.current.type).toBe('note');
      expect(result.current.category).toBe('Technical');
    });
  });
});
