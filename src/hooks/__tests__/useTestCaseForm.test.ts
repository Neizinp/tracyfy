/**
 * useTestCaseForm Hook Tests
 *
 * Tests for the test case form hook.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTestCaseForm } from '../useTestCaseForm';
import type { TestCase } from '../../types';

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
    status: 'pending',
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

describe('useTestCaseForm', () => {
  const mockOnClose = vi.fn();
  const mockOnCreate = vi.fn();
  const mockOnUpdate = vi.fn();
  const mockOnDelete = vi.fn();

  const defaultOptions = {
    isOpen: true,
    testCase: null,
    onClose: mockOnClose,
    onCreate: mockOnCreate,
    onUpdate: mockOnUpdate,
    onDelete: mockOnDelete,
  };

  const existingTestCase: TestCase = {
    id: 'TC-001',
    title: 'Existing Test Case',
    description: 'Test description',
    preconditions: 'User is logged in',
    steps: 'Step 1\nStep 2\nStep 3',
    expectedResults: 'Test passes',
    priority: 'high',
    status: 'passed',
    dateCreated: 1700000000000,
    lastModified: 1700000100000,
    revision: '01',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Hook initialization', () => {
    it('should return all expected fields and methods', () => {
      const { result } = renderHook(() => useTestCaseForm(defaultOptions));

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

      // Test case-specific
      expect(result.current.preconditions).toBeDefined();
      expect(result.current.setPreconditions).toBeDefined();
      expect(result.current.steps).toBeDefined();
      expect(result.current.setSteps).toBeDefined();
      expect(result.current.expectedResults).toBeDefined();
      expect(result.current.setExpectedResults).toBeDefined();

      // Actions
      expect(result.current.handleSubmit).toBeDefined();
      expect(result.current.handleDelete).toBeDefined();
    });
  });

  describe('Specialized fields', () => {
    it('should initialize specialized fields to empty when creating new', () => {
      const { result } = renderHook(() => useTestCaseForm(defaultOptions));

      expect(result.current.preconditions).toBe('');
      expect(result.current.steps).toBe('');
      expect(result.current.expectedResults).toBe('');
    });

    it('should update preconditions field', () => {
      const { result } = renderHook(() => useTestCaseForm(defaultOptions));

      act(() => {
        result.current.setPreconditions('System is running');
      });

      expect(result.current.preconditions).toBe('System is running');
    });

    it('should update steps field', () => {
      const { result } = renderHook(() => useTestCaseForm(defaultOptions));

      act(() => {
        result.current.setSteps('1. Open app\n2. Click login');
      });

      expect(result.current.steps).toBe('1. Open app\n2. Click login');
    });

    it('should update expectedResults field', () => {
      const { result } = renderHook(() => useTestCaseForm(defaultOptions));

      act(() => {
        result.current.setExpectedResults('User is logged in');
      });

      expect(result.current.expectedResults).toBe('User is logged in');
    });
  });

  describe('Field updates with existing test case', () => {
    it('should sync specialized fields when test case changes', () => {
      const { result, rerender } = renderHook((options) => useTestCaseForm(options), {
        initialProps: { ...defaultOptions, testCase: null },
      });

      // Initially empty
      expect(result.current.preconditions).toBe('');

      // Update to existing test case
      rerender({ ...defaultOptions, testCase: existingTestCase });

      expect(result.current.preconditions).toBe('User is logged in');
      expect(result.current.steps).toBe('Step 1\nStep 2\nStep 3');
      expect(result.current.expectedResults).toBe('Test passes');
    });
  });
});
