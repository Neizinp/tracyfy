import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUIState } from '../useUIState';

describe('useUIState', () => {
  describe('initial state', () => {
    it('should return all modal states as false initially', () => {
      const { result } = renderHook(() => useUIState());

      expect(result.current.isNewRequirementModalOpen).toBe(false);
      expect(result.current.isLinkModalOpen).toBe(false);
      expect(result.current.isEditRequirementModalOpen).toBe(false);
      expect(result.current.isUseCaseModalOpen).toBe(false);
      expect(result.current.isVersionHistoryOpen).toBe(false);
      expect(result.current.isProjectSettingsOpen).toBe(false);
      expect(result.current.isCreateProjectModalOpen).toBe(false);
      expect(result.current.isNewTestCaseModalOpen).toBe(false);
      expect(result.current.isEditTestCaseModalOpen).toBe(false);
      expect(result.current.isInformationModalOpen).toBe(false);
      expect(result.current.isLibraryPanelOpen).toBe(false);
      expect(result.current.isGlobalLibraryModalOpen).toBe(false);
      expect(result.current.isUserSettingsModalOpen).toBe(false);
    });

    it('should return null for selection states initially', () => {
      const { result } = renderHook(() => useUIState());

      expect(result.current.selectedRequirementId).toBeNull();
      expect(result.current.selectedTestCaseId).toBeNull();
      expect(result.current.selectedInformation).toBeNull();
      expect(result.current.editingRequirement).toBeNull();
      expect(result.current.editingUseCase).toBeNull();
      expect(result.current.projectToEdit).toBeNull();
    });

    it('should have empty search query initially', () => {
      const { result } = renderHook(() => useUIState());

      expect(result.current.searchQuery).toBe('');
    });

    it('should have requirements as default library tab', () => {
      const { result } = renderHook(() => useUIState());

      expect(result.current.activeLibraryTab).toBe('requirements');
    });

    it('should have empty global library selection', () => {
      const { result } = renderHook(() => useUIState());

      expect(result.current.globalLibrarySelection.size).toBe(0);
    });
  });

  describe('modal state setters', () => {
    it('should toggle new requirement modal', () => {
      const { result } = renderHook(() => useUIState());

      act(() => {
        result.current.setIsNewRequirementModalOpen(true);
      });

      expect(result.current.isNewRequirementModalOpen).toBe(true);
    });

    it('should toggle version history', () => {
      const { result } = renderHook(() => useUIState());

      act(() => {
        result.current.setIsVersionHistoryOpen(true);
      });

      expect(result.current.isVersionHistoryOpen).toBe(true);
    });
  });

  describe('column visibility', () => {
    it('should return default column visibility', () => {
      const { result } = renderHook(() => useUIState());

      const defaults = result.current.getDefaultColumnVisibility();

      expect(defaults.idTitle).toBe(true);
      expect(defaults.description).toBe(true);
      expect(defaults.priority).toBe(true);
      expect(defaults.status).toBe(true);
    });

    it('should allow updating column visibility', () => {
      const { result } = renderHook(() => useUIState());

      act(() => {
        result.current.setColumnVisibility({
          ...result.current.columnVisibility,
          description: false,
        });
      });

      expect(result.current.columnVisibility.description).toBe(false);
    });
  });

  describe('library functions', () => {
    it('should toggle global library selection', () => {
      const { result } = renderHook(() => useUIState());

      act(() => {
        result.current.handleGlobalLibrarySelect('REQ-001');
      });

      expect(result.current.globalLibrarySelection.has('REQ-001')).toBe(true);

      act(() => {
        result.current.handleGlobalLibrarySelect('REQ-001');
      });

      expect(result.current.globalLibrarySelection.has('REQ-001')).toBe(false);
    });

    it('should open library panel with specified tab', () => {
      const { result } = renderHook(() => useUIState());

      act(() => {
        result.current.handleOpenLibrary('testcases');
      });

      expect(result.current.activeLibraryTab).toBe('testcases');
      expect(result.current.isLibraryPanelOpen).toBe(true);
    });
  });

  describe('search state', () => {
    it('should update search query', () => {
      const { result } = renderHook(() => useUIState());

      act(() => {
        result.current.setSearchQuery('test search');
      });

      expect(result.current.searchQuery).toBe('test search');
    });
  });
});
