/**
 * useDocumentForm Hook Tests
 *
 * Tests for the document form hook.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDocumentForm } from '../useDocumentForm';
import type { ArtifactDocument } from '../../types';

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
    author: '',
    setAuthor: vi.fn(),
    currentUser: { name: 'Test User' },
    handleSubmit: vi.fn(),
    handleDelete: vi.fn(),
    confirmDelete: vi.fn(),
    cancelDelete: vi.fn(),
    showDeleteConfirm: false,
  })),
}));

describe('useDocumentForm', () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  const defaultOptions = {
    isOpen: true,
    document: null,
    onClose: mockOnClose,
    onSubmit: mockOnSubmit,
  };

  const existingDocument: ArtifactDocument = {
    id: 'DOC-001',
    title: 'Existing Document',
    content: 'Document content...',
    author: 'Author Name',
    status: 'approved',
    dateCreated: 1700000000000,
    lastModified: 1700000100000,
    revision: '02',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Hook initialization', () => {
    it('should return all expected fields and methods', () => {
      const { result } = renderHook(() => useDocumentForm(defaultOptions));

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

      // Actions
      expect(result.current.handleSubmit).toBeDefined();
      expect(result.current.handleDelete).toBeDefined();
    });
  });

  describe('Content field', () => {
    it('should initialize content to empty when creating new', () => {
      const { result } = renderHook(() => useDocumentForm(defaultOptions));

      expect(result.current.content).toBe('');
    });

    it('should update content field', () => {
      const { result } = renderHook(() => useDocumentForm(defaultOptions));

      act(() => {
        result.current.setContent('New document content');
      });

      expect(result.current.content).toBe('New document content');
    });
  });

  describe('Field updates with existing document', () => {
    it('should sync content when document changes', () => {
      const { result, rerender } = renderHook((options) => useDocumentForm(options), {
        initialProps: { ...defaultOptions, document: null },
      });

      // Initially empty
      expect(result.current.content).toBe('');

      // Update to existing document
      rerender({ ...defaultOptions, document: existingDocument });

      expect(result.current.content).toBe('Document content...');
    });
  });

  describe('Delete confirmation', () => {
    it('should expose delete confirmation state', () => {
      const { result } = renderHook(() => useDocumentForm(defaultOptions));

      expect(result.current.showDeleteConfirm).toBe(false);
      expect(result.current.confirmDelete).toBeDefined();
      expect(result.current.cancelDelete).toBeDefined();
    });
  });
});
