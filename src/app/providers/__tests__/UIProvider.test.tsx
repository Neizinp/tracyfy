import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { UIProvider, useUI } from '../UIProvider';

// Mock the useUIState hook
vi.mock('../../../hooks/useUIState', () => ({
  useUIState: vi.fn(() => ({
    // Modal states
    isNewRequirementModalOpen: false,
    setIsNewRequirementModalOpen: vi.fn(),
    isLinkModalOpen: false,
    setIsLinkModalOpen: vi.fn(),
    isEditRequirementModalOpen: false,
    setIsEditRequirementModalOpen: vi.fn(),
    isUseCaseModalOpen: false,
    setIsUseCaseModalOpen: vi.fn(),
    isTrashModalOpen: false,
    setIsTrashModalOpen: vi.fn(),
    isVersionHistoryOpen: false,
    setIsVersionHistoryOpen: vi.fn(),
    isProjectSettingsOpen: false,
    setIsProjectSettingsOpen: vi.fn(),
    isCreateProjectModalOpen: false,
    setIsCreateProjectModalOpen: vi.fn(),
    isNewTestCaseModalOpen: false,
    setIsNewTestCaseModalOpen: vi.fn(),
    isEditTestCaseModalOpen: false,
    setIsEditTestCaseModalOpen: vi.fn(),
    isInformationModalOpen: false,
    setIsInformationModalOpen: vi.fn(),
    isLibraryPanelOpen: false,
    setIsLibraryPanelOpen: vi.fn(),
    isGlobalLibraryModalOpen: false,
    setIsGlobalLibraryModalOpen: vi.fn(),
    isUserSettingsModalOpen: false,
    setIsUserSettingsModalOpen: vi.fn(),

    // Selections
    selectedRequirementId: null,
    setSelectedRequirementId: vi.fn(),
    selectedTestCaseId: null,
    setSelectedTestCaseId: vi.fn(),
    selectedInformation: null,
    setSelectedInformation: vi.fn(),
    editingRequirement: null,
    setEditingRequirement: vi.fn(),
    editingUseCase: null,
    setEditingUseCase: vi.fn(),
    projectToEdit: null,
    setProjectToEdit: vi.fn(),

    // Library state
    activeLibraryTab: 'requirements' as const,
    setActiveLibraryTab: vi.fn(),
    globalLibrarySelection: new Set<string>(),
    setGlobalLibrarySelection: vi.fn(),

    // Column visibility
    columnVisibility: {
      idTitle: true,
      description: false,
      text: false,
      rationale: false,
      author: false,
      verification: false,
      priority: true,
      status: true,
      comments: false,
      created: false,
      approved: false,
    },
    setColumnVisibility: vi.fn(),
    getDefaultColumnVisibility: vi.fn(() => ({
      idTitle: true,
      description: false,
      text: false,
      rationale: false,
      author: false,
      verification: false,
      priority: true,
      status: true,
      comments: false,
      created: false,
      approved: false,
    })),

    // Search
    searchQuery: '',
    setSearchQuery: vi.fn(),

    // Link source
    linkSourceId: null,
    setLinkSourceId: vi.fn(),
    linkSourceType: null,
    setLinkSourceType: vi.fn(),

    // Helper functions
    handleGlobalLibrarySelect: vi.fn(),
    handleOpenLibrary: vi.fn(),
  })),
}));

describe('UIProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Provider rendering', () => {
    it('should render children', () => {
      render(
        <UIProvider>
          <div data-testid="child">Child content</div>
        </UIProvider>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.getByText('Child content')).toBeInTheDocument();
    });
  });

  describe('useUI hook', () => {
    it('should provide UI context values', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <UIProvider>{children}</UIProvider>
      );

      const { result } = renderHook(() => useUI(), { wrapper });

      // Modal states
      expect(result.current.isNewRequirementModalOpen).toBe(false);
      expect(typeof result.current.setIsNewRequirementModalOpen).toBe('function');
      expect(result.current.isLinkModalOpen).toBe(false);
      expect(result.current.isUseCaseModalOpen).toBe(false);
    });

    it('should provide selection state', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <UIProvider>{children}</UIProvider>
      );

      const { result } = renderHook(() => useUI(), { wrapper });

      expect(result.current.selectedRequirementId).toBeNull();
      expect(typeof result.current.setSelectedRequirementId).toBe('function');
      expect(result.current.editingRequirement).toBeNull();
      expect(result.current.editingUseCase).toBeNull();
    });

    it('should provide library state', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <UIProvider>{children}</UIProvider>
      );

      const { result } = renderHook(() => useUI(), { wrapper });

      expect(result.current.activeLibraryTab).toBe('requirements');
      expect(result.current.globalLibrarySelection).toBeInstanceOf(Set);
      expect(typeof result.current.handleOpenLibrary).toBe('function');
    });

    it('should provide column visibility', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <UIProvider>{children}</UIProvider>
      );

      const { result } = renderHook(() => useUI(), { wrapper });

      expect(result.current.columnVisibility).toBeDefined();
      expect(result.current.columnVisibility.idTitle).toBe(true);
      expect(result.current.columnVisibility.status).toBe(true);
      expect(typeof result.current.setColumnVisibility).toBe('function');
    });

    it('should provide search state', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <UIProvider>{children}</UIProvider>
      );

      const { result } = renderHook(() => useUI(), { wrapper });

      expect(result.current.searchQuery).toBe('');
      expect(typeof result.current.setSearchQuery).toBe('function');
    });

    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useUI());
      }).toThrow('useUI must be used within a UIProvider');

      consoleSpy.mockRestore();
    });
  });
});
