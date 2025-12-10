import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { ProjectProvider, useProject } from '../ProjectProvider';
import type { Project } from '../../../types';

// Mock FileSystemProvider
const mockProjects: Project[] = [
  {
    id: 'proj-001',
    name: 'Test Project 1',
    description: 'Test Description 1',
    requirementIds: ['REQ-001'],
    useCaseIds: ['UC-001'],
    testCaseIds: ['TC-001'],
    informationIds: ['INFO-001'],
    lastModified: 1000000,
  },
  {
    id: 'proj-002',
    name: 'Test Project 2',
    description: 'Test Description 2',
    requirementIds: [],
    useCaseIds: [],
    testCaseIds: [],
    informationIds: [],
    lastModified: 2000000,
  },
];

const mockSetCurrentProject = vi.fn().mockResolvedValue(undefined);
const mockFsCreateProject = vi
  .fn()
  .mockImplementation(async (name: string, description: string) => {
    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name,
      description,
      requirementIds: [],
      useCaseIds: [],
      testCaseIds: [],
      informationIds: [],
      lastModified: Date.now(),
    };
    return newProject;
  });
const mockSaveProject = vi.fn().mockResolvedValue(undefined);
const mockFsDeleteProject = vi.fn().mockResolvedValue(undefined);

vi.mock('../FileSystemProvider', () => ({
  useFileSystem: vi.fn(() => ({
    projects: mockProjects,
    currentProjectId: 'proj-001',
    isLoading: false,
    isReady: true,
    createProject: mockFsCreateProject,
    saveProject: mockSaveProject,
    deleteProject: mockFsDeleteProject,
    setCurrentProject: mockSetCurrentProject,
  })),
}));

describe('ProjectProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Provider rendering', () => {
    it('should render children', () => {
      render(
        <ProjectProvider>
          <div data-testid="child">Child content</div>
        </ProjectProvider>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.getByText('Child content')).toBeInTheDocument();
    });
  });

  describe('useProject hook', () => {
    it('should provide projects list', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ProjectProvider>{children}</ProjectProvider>
      );

      const { result } = renderHook(() => useProject(), { wrapper });

      expect(result.current.projects).toEqual(mockProjects);
      expect(result.current.projects).toHaveLength(2);
    });

    it('should provide current project ID', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ProjectProvider>{children}</ProjectProvider>
      );

      const { result } = renderHook(() => useProject(), { wrapper });

      expect(result.current.currentProjectId).toBe('proj-001');
    });

    it('should provide current project object', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ProjectProvider>{children}</ProjectProvider>
      );

      const { result } = renderHook(() => useProject(), { wrapper });

      expect(result.current.currentProject).toBeDefined();
      expect(result.current.currentProject?.id).toBe('proj-001');
      expect(result.current.currentProject?.name).toBe('Test Project 1');
    });

    it('should provide loading state', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ProjectProvider>{children}</ProjectProvider>
      );

      const { result } = renderHook(() => useProject(), { wrapper });

      expect(result.current.isLoading).toBe(false);
    });

    it('should switch project', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ProjectProvider>{children}</ProjectProvider>
      );

      const { result } = renderHook(() => useProject(), { wrapper });

      await act(async () => {
        await result.current.switchProject('proj-002');
      });

      expect(mockSetCurrentProject).toHaveBeenCalledWith('proj-002');
    });

    it('should create project', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ProjectProvider>{children}</ProjectProvider>
      );

      const { result } = renderHook(() => useProject(), { wrapper });

      let newProject: Project | undefined;
      await act(async () => {
        newProject = await result.current.createProject('New Project', 'Description');
      });

      expect(mockFsCreateProject).toHaveBeenCalledWith('New Project', 'Description');
      expect(newProject).toBeDefined();
      expect(newProject?.name).toBe('New Project');
      expect(mockSetCurrentProject).toHaveBeenCalled();
    });

    it('should update project', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ProjectProvider>{children}</ProjectProvider>
      );

      const { result } = renderHook(() => useProject(), { wrapper });

      const updatedProject: Project = {
        ...mockProjects[0],
        name: 'Updated Name',
      };

      await act(async () => {
        await result.current.updateProject(updatedProject);
      });

      expect(mockSaveProject).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Updated Name',
          lastModified: expect.any(Number),
        })
      );
    });

    it('should delete project', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ProjectProvider>{children}</ProjectProvider>
      );

      const { result } = renderHook(() => useProject(), { wrapper });

      await act(async () => {
        await result.current.deleteProject('proj-002');
      });

      expect(mockFsDeleteProject).toHaveBeenCalledWith('proj-002');
    });

    it('should add artifacts to project', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ProjectProvider>{children}</ProjectProvider>
      );

      const { result } = renderHook(() => useProject(), { wrapper });

      await act(async () => {
        await result.current.addToProject({
          requirements: ['REQ-002'],
          useCases: ['UC-002'],
          testCases: ['TC-002'],
          information: ['INFO-002'],
        });
      });

      expect(mockSaveProject).toHaveBeenCalledWith(
        expect.objectContaining({
          requirementIds: expect.arrayContaining(['REQ-001', 'REQ-002']),
          useCaseIds: expect.arrayContaining(['UC-001', 'UC-002']),
          testCaseIds: expect.arrayContaining(['TC-001', 'TC-002']),
          informationIds: expect.arrayContaining(['INFO-001', 'INFO-002']),
        })
      );
    });

    it('should throw error when used outside provider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useProject());
      }).toThrow('useProject must be used within a ProjectProvider');

      consoleSpy.mockRestore();
    });
  });
});
