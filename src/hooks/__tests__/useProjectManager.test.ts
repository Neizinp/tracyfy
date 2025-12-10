import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useProjectManager } from '../useProjectManager';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  };
})();

// Mock appInitialization
vi.mock('../../utils/appInitialization', () => ({
  loadProjects: vi.fn(() => ({
    projects: [
      {
        id: 'proj-001',
        name: 'Test Project',
        description: 'Test Description',
        requirementIds: [],
        useCaseIds: [],
        testCaseIds: [],
        informationIds: [],
        lastModified: 1000000,
      },
    ],
    currentProjectId: 'proj-001',
    globalState: {},
  })),
  PROJECTS_KEY: 'reqtrace_projects',
  CURRENT_PROJECT_KEY: 'reqtrace_current_project',
}));

describe('useProjectManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should load projects on mount', async () => {
      const { result } = renderHook(() => useProjectManager());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.projects).toHaveLength(1);
      expect(result.current.projects[0].id).toBe('proj-001');
      expect(result.current.currentProjectId).toBe('proj-001');
    });

    it('should provide initialGlobalState', async () => {
      const { result } = renderHook(() => useProjectManager());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.initialGlobalState).toBeDefined();
    });
  });

  describe('handleSwitchProject', () => {
    it('should update currentProjectId', async () => {
      const { result } = renderHook(() => useProjectManager());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.handleSwitchProject('proj-002');
      });

      expect(result.current.currentProjectId).toBe('proj-002');
    });

    it('should persist currentProjectId to localStorage', async () => {
      const { result } = renderHook(() => useProjectManager());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.handleSwitchProject('proj-002');
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith('reqtrace_current_project', 'proj-002');
    });
  });

  describe('handleCreateProjectSubmit', () => {
    it('should create a new project with correct structure', async () => {
      const { result } = renderHook(() => useProjectManager());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let newProject: any;
      await act(async () => {
        newProject = await result.current.handleCreateProjectSubmit(
          'New Project',
          'New Description'
        );
      });

      expect(newProject).toMatchObject({
        name: 'New Project',
        description: 'New Description',
        requirementIds: [],
        useCaseIds: [],
        testCaseIds: [],
        informationIds: [],
      });
      expect(newProject.id).toMatch(/^proj-\d+$/);
      expect(newProject.lastModified).toBeDefined();
    });

    it('should add new project to projects list', async () => {
      const { result } = renderHook(() => useProjectManager());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const initialCount = result.current.projects.length;

      await act(async () => {
        await result.current.handleCreateProjectSubmit('New Project', 'Description');
      });

      expect(result.current.projects.length).toBe(initialCount + 1);
    });

    it('should switch to newly created project', async () => {
      const { result } = renderHook(() => useProjectManager());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let newProject: any;
      await act(async () => {
        newProject = await result.current.handleCreateProjectSubmit(
          'New Project',
          'New Description'
        );
      });

      expect(result.current.currentProjectId).toBe(newProject.id);
    });
  });

  describe('handleUpdateProject', () => {
    it('should update project name and description', async () => {
      const { result } = renderHook(() => useProjectManager());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.handleUpdateProject('proj-001', 'Updated Name', 'Updated Description');
      });

      const updatedProject = result.current.projects.find((p) => p.id === 'proj-001');
      expect(updatedProject?.name).toBe('Updated Name');
      expect(updatedProject?.description).toBe('Updated Description');
    });

    it('should update lastModified timestamp', async () => {
      const { result } = renderHook(() => useProjectManager());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const beforeTime = Date.now();

      act(() => {
        result.current.handleUpdateProject('proj-001', 'Updated Name', 'Updated Description');
      });

      const afterTime = Date.now();
      const updatedProject = result.current.projects.find((p) => p.id === 'proj-001');
      expect(updatedProject?.lastModified).toBeGreaterThanOrEqual(beforeTime);
      expect(updatedProject?.lastModified).toBeLessThanOrEqual(afterTime);
    });

    it('should not affect other projects', async () => {
      const { result } = renderHook(() => useProjectManager());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Add another project first
      await act(async () => {
        await result.current.handleCreateProjectSubmit('Second Project', 'Second Desc');
      });

      const secondProjectId = result.current.projects.find((p) => p.name === 'Second Project')?.id;

      act(() => {
        result.current.handleUpdateProject('proj-001', 'Updated', 'Updated');
      });

      const secondProject = result.current.projects.find((p) => p.id === secondProjectId);
      expect(secondProject?.name).toBe('Second Project');
    });
  });

  describe('handleDeleteProject', () => {
    it('should remove project from list', async () => {
      const { result } = renderHook(() => useProjectManager());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Add another project so we can delete one
      await act(async () => {
        await result.current.handleCreateProjectSubmit('Second Project', 'Desc');
      });

      const initialCount = result.current.projects.length;

      act(() => {
        result.current.handleDeleteProject('proj-001');
      });

      expect(result.current.projects.length).toBe(initialCount - 1);
      expect(result.current.projects.find((p) => p.id === 'proj-001')).toBeUndefined();
    });

    it('should switch to another project when current is deleted', async () => {
      const { result } = renderHook(() => useProjectManager());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Add another project
      let secondProject: any;
      await act(async () => {
        secondProject = await result.current.handleCreateProjectSubmit('Second Project', 'Desc');
      });

      // Now current project is the second one (handleCreateProjectSubmit switches to it)
      // Switch back to first project
      act(() => {
        result.current.handleSwitchProject('proj-001');
      });

      // Delete the current project (proj-001)
      act(() => {
        result.current.handleDeleteProject('proj-001');
      });

      // Should switch to the remaining project (second project)
      expect(result.current.currentProjectId).toBe(secondProject.id);
    });

    it('should clear currentProjectId when last project is deleted', async () => {
      const { result } = renderHook(() => useProjectManager());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.handleDeleteProject('proj-001');
      });

      expect(result.current.currentProjectId).toBe('');
      expect(result.current.projects.length).toBe(0);
    });
  });

  describe('handleAddToProject', () => {
    it('should add artifact IDs to project', async () => {
      const { result } = renderHook(() => useProjectManager());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.handleAddToProject({
          requirements: ['REQ-001', 'REQ-002'],
          useCases: ['UC-001'],
          testCases: ['TC-001'],
          information: ['INFO-001'],
        });
      });

      const project = result.current.projects.find((p) => p.id === 'proj-001');
      expect(project?.requirementIds).toContain('REQ-001');
      expect(project?.requirementIds).toContain('REQ-002');
      expect(project?.useCaseIds).toContain('UC-001');
      expect(project?.testCaseIds).toContain('TC-001');
      expect(project?.informationIds).toContain('INFO-001');
    });

    it('should not add duplicate IDs', async () => {
      const { result } = renderHook(() => useProjectManager());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Add once
      await act(async () => {
        await result.current.handleAddToProject({
          requirements: ['REQ-001'],
          useCases: [],
          testCases: [],
          information: [],
        });
      });

      // Add again
      await act(async () => {
        await result.current.handleAddToProject({
          requirements: ['REQ-001'],
          useCases: [],
          testCases: [],
          information: [],
        });
      });

      const project = result.current.projects.find((p) => p.id === 'proj-001');
      const reqCount = project?.requirementIds.filter((id) => id === 'REQ-001').length;
      expect(reqCount).toBe(1);
    });

    it('should add to specified target project', async () => {
      const { result } = renderHook(() => useProjectManager());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Create another project
      let newProject: any;
      await act(async () => {
        newProject = await result.current.handleCreateProjectSubmit('Target Project', 'Desc');
      });

      await act(async () => {
        await result.current.handleAddToProject(
          {
            requirements: ['REQ-999'],
            useCases: [],
            testCases: [],
            information: [],
          },
          newProject.id
        );
      });

      const targetProject = result.current.projects.find((p) => p.id === newProject.id);
      expect(targetProject?.requirementIds).toContain('REQ-999');

      // Original project should not have it
      const originalProject = result.current.projects.find((p) => p.id === 'proj-001');
      expect(originalProject?.requirementIds).not.toContain('REQ-999');
    });

    it('should update lastModified when adding artifacts', async () => {
      const { result } = renderHook(() => useProjectManager());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const beforeTime = Date.now();

      await act(async () => {
        await result.current.handleAddToProject({
          requirements: ['REQ-001'],
          useCases: [],
          testCases: [],
          information: [],
        });
      });

      const afterTime = Date.now();
      const project = result.current.projects.find((p) => p.id === 'proj-001');
      expect(project?.lastModified).toBeGreaterThanOrEqual(beforeTime);
      expect(project?.lastModified).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('setHasInitializedProjects', () => {
    it('should expose setHasInitializedProjects function', async () => {
      const { result } = renderHook(() => useProjectManager());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(typeof result.current.setHasInitializedProjects).toBe('function');

      // Should not throw
      act(() => {
        result.current.setHasInitializedProjects(true);
      });
    });
  });

  describe('setProjects', () => {
    it('should expose setProjects for complex updates', async () => {
      const { result } = renderHook(() => useProjectManager());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(typeof result.current.setProjects).toBe('function');
    });
  });
});
