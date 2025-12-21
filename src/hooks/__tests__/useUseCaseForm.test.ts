/**
 * useUseCaseForm Hook Tests
 *
 * Tests for the use case form hook.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUseCaseForm } from '../useUseCaseForm';
import type { UseCase } from '../../types';

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
    activeTab: 'overview',
    setActiveTab: vi.fn(),
    title: '',
    setTitle: vi.fn(),
    description: '',
    setDescription: vi.fn(),
    priority: 'medium',
    setPriority: vi.fn(),
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

describe('useUseCaseForm', () => {
  const mockOnClose = vi.fn();
  const mockOnCreate = vi.fn();
  const mockOnUpdate = vi.fn();
  const mockOnDelete = vi.fn();

  const defaultOptions = {
    isOpen: true,
    useCase: null,
    onClose: mockOnClose,
    onCreate: mockOnCreate,
    onUpdate: mockOnUpdate,
    onDelete: mockOnDelete,
  };

  const existingUseCase: UseCase = {
    id: 'UC-001',
    title: 'Existing Use Case',
    description: 'Use case description',
    actor: 'User',
    preconditions: 'User is logged in',
    mainFlow: '1. User clicks button\n2. System responds',
    alternativeFlows: 'User cancels',
    postconditions: 'Action is complete',
    priority: 'high',
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
      const { result } = renderHook(() => useUseCaseForm(defaultOptions));

      // Mode
      expect(result.current.isEditMode).toBeDefined();

      // Tab state
      expect(result.current.activeTab).toBeDefined();
      expect(result.current.setActiveTab).toBeDefined();

      // Form fields
      expect(result.current.title).toBeDefined();
      expect(result.current.setTitle).toBeDefined();
      expect(result.current.description).toBeDefined();
      expect(result.current.setDescription).toBeDefined();
      expect(result.current.priority).toBeDefined();
      expect(result.current.setPriority).toBeDefined();
      expect(result.current.status).toBeDefined();
      expect(result.current.setStatus).toBeDefined();

      // Use case-specific
      expect(result.current.actor).toBeDefined();
      expect(result.current.setActor).toBeDefined();
      expect(result.current.preconditions).toBeDefined();
      expect(result.current.setPreconditions).toBeDefined();
      expect(result.current.mainFlow).toBeDefined();
      expect(result.current.setMainFlow).toBeDefined();
      expect(result.current.alternativeFlows).toBeDefined();
      expect(result.current.setAlternativeFlows).toBeDefined();
      expect(result.current.postconditions).toBeDefined();
      expect(result.current.setPostconditions).toBeDefined();

      // Actions
      expect(result.current.handleSubmit).toBeDefined();
      expect(result.current.handleDelete).toBeDefined();
    });
  });

  describe('Specialized fields', () => {
    it('should initialize specialized fields to empty when creating new', () => {
      const { result } = renderHook(() => useUseCaseForm(defaultOptions));

      expect(result.current.actor).toBe('');
      expect(result.current.preconditions).toBe('');
      expect(result.current.mainFlow).toBe('');
      expect(result.current.alternativeFlows).toBe('');
      expect(result.current.postconditions).toBe('');
    });

    it('should update actor field', () => {
      const { result } = renderHook(() => useUseCaseForm(defaultOptions));

      act(() => {
        result.current.setActor('Administrator');
      });

      expect(result.current.actor).toBe('Administrator');
    });

    it('should update mainFlow field', () => {
      const { result } = renderHook(() => useUseCaseForm(defaultOptions));

      act(() => {
        result.current.setMainFlow('1. User logs in\n2. User views dashboard');
      });

      expect(result.current.mainFlow).toBe('1. User logs in\n2. User views dashboard');
    });

    it('should update preconditions field', () => {
      const { result } = renderHook(() => useUseCaseForm(defaultOptions));

      act(() => {
        result.current.setPreconditions('System is running');
      });

      expect(result.current.preconditions).toBe('System is running');
    });

    it('should update alternativeFlows field', () => {
      const { result } = renderHook(() => useUseCaseForm(defaultOptions));

      act(() => {
        result.current.setAlternativeFlows('User clicks cancel');
      });

      expect(result.current.alternativeFlows).toBe('User clicks cancel');
    });

    it('should update postconditions field', () => {
      const { result } = renderHook(() => useUseCaseForm(defaultOptions));

      act(() => {
        result.current.setPostconditions('User is logged out');
      });

      expect(result.current.postconditions).toBe('User is logged out');
    });
  });

  describe('Field updates with existing use case', () => {
    it('should sync specialized fields when use case changes', () => {
      const { result, rerender } = renderHook((options) => useUseCaseForm(options), {
        initialProps: { ...defaultOptions, useCase: null },
      });

      // Initially empty
      expect(result.current.actor).toBe('');

      // Update to existing use case
      rerender({ ...defaultOptions, useCase: existingUseCase });

      expect(result.current.actor).toBe('User');
      expect(result.current.preconditions).toBe('User is logged in');
      expect(result.current.mainFlow).toBe('1. User clicks button\n2. System responds');
      expect(result.current.alternativeFlows).toBe('User cancels');
      expect(result.current.postconditions).toBe('Action is complete');
    });
  });
});
