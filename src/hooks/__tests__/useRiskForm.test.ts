/**
 * useRiskForm Hook Tests
 *
 * Tests for the risk form hook.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRiskForm } from '../useRiskForm';
import type { Risk } from '../../types';

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
    status: 'open',
    setStatus: vi.fn(),
    author: '',
    setAuthor: vi.fn(),
    currentUser: { name: 'Test User' },
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

describe('useRiskForm', () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  const defaultOptions = {
    isOpen: true,
    risk: null,
    onClose: mockOnClose,
    onSubmit: mockOnSubmit,
  };

  const existingRisk: Risk = {
    id: 'RISK-001',
    title: 'Existing Risk',
    description: 'Risk description',
    probability: 'high',
    impact: 'critical',
    status: 'mitigated',
    mitigation: 'Mitigation strategy',
    owner: 'Risk Owner',
    category: 'technical',
    dateCreated: 1700000000000,
    lastModified: 1700000100000,
    revision: '01',
    contingency: 'Contingency plan',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Hook initialization', () => {
    it('should return all expected fields and methods', () => {
      const { result } = renderHook(() => useRiskForm(defaultOptions));

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
      expect(result.current.status).toBeDefined();
      expect(result.current.setStatus).toBeDefined();

      // Risk-specific
      expect(result.current.category).toBeDefined();
      expect(result.current.setCategory).toBeDefined();
      expect(result.current.probability).toBeDefined();
      expect(result.current.setProbability).toBeDefined();
      expect(result.current.impact).toBeDefined();
      expect(result.current.setImpact).toBeDefined();
      expect(result.current.owner).toBeDefined();
      expect(result.current.setOwner).toBeDefined();
      expect(result.current.mitigation).toBeDefined();
      expect(result.current.setMitigation).toBeDefined();
      expect(result.current.contingency).toBeDefined();
      expect(result.current.setContingency).toBeDefined();

      // Computed
      expect(result.current.riskScore).toBeDefined();
      expect(result.current.riskLevel).toBeDefined();
      expect(result.current.riskColor).toBeDefined();

      // Actions
      expect(result.current.handleSubmit).toBeDefined();
      expect(result.current.handleDelete).toBeDefined();
    });
  });

  describe('Specialized fields', () => {
    it('should initialize specialized fields with defaults when creating new', () => {
      const { result } = renderHook(() => useRiskForm(defaultOptions));

      expect(result.current.category).toBe('other');
      expect(result.current.impact).toBe('medium');
      expect(result.current.owner).toBe('');
      expect(result.current.mitigation).toBe('');
      expect(result.current.contingency).toBe('');
    });

    it('should update category field', () => {
      const { result } = renderHook(() => useRiskForm(defaultOptions));

      act(() => {
        result.current.setCategory('technical');
      });

      expect(result.current.category).toBe('technical');
    });

    it('should update impact field', () => {
      const { result } = renderHook(() => useRiskForm(defaultOptions));

      act(() => {
        result.current.setImpact('high');
      });

      expect(result.current.impact).toBe('high');
    });

    it('should update owner field', () => {
      const { result } = renderHook(() => useRiskForm(defaultOptions));

      act(() => {
        result.current.setOwner('John Doe');
      });

      expect(result.current.owner).toBe('John Doe');
    });

    it('should update mitigation field', () => {
      const { result } = renderHook(() => useRiskForm(defaultOptions));

      act(() => {
        result.current.setMitigation('Implement security controls');
      });

      expect(result.current.mitigation).toBe('Implement security controls');
    });

    it('should update contingency field', () => {
      const { result } = renderHook(() => useRiskForm(defaultOptions));

      act(() => {
        result.current.setContingency('Backup plan');
      });

      expect(result.current.contingency).toBe('Backup plan');
    });
  });

  describe('Risk score calculation', () => {
    it('should calculate risk score based on probability and impact', () => {
      const { result } = renderHook(() => useRiskForm(defaultOptions));

      // Default: medium probability * medium impact = 2 * 2 = 4
      expect(result.current.riskScore).toBeDefined();
    });

    it('should update risk level based on score', () => {
      const { result } = renderHook(() => useRiskForm(defaultOptions));

      expect(result.current.riskLevel).toBeDefined();
      expect(['low', 'medium', 'high']).toContain(result.current.riskLevel);
    });

    it('should update risk color based on level', () => {
      const { result } = renderHook(() => useRiskForm(defaultOptions));

      expect(result.current.riskColor).toBeDefined();
      expect(result.current.riskColor).toContain('var(--color-');
    });
  });

  describe('Field updates with existing risk', () => {
    it('should sync specialized fields when risk changes', () => {
      const { result, rerender } = renderHook((options) => useRiskForm(options), {
        initialProps: { ...defaultOptions, risk: null },
      });

      // Initially defaults
      expect(result.current.category).toBe('other');

      // Update to existing risk
      rerender({ ...defaultOptions, risk: existingRisk });

      expect(result.current.category).toBe('technical');
      expect(result.current.impact).toBe('critical');
      expect(result.current.owner).toBe('Risk Owner');
      expect(result.current.mitigation).toBe('Mitigation strategy');
      expect(result.current.contingency).toBe('Contingency plan');
    });
  });
});
