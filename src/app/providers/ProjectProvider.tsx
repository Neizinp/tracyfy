import React, { createContext, useContext, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useFileSystem } from './FileSystemProvider';
import type { Project } from '../../types';

interface ProjectContextValue {
  // State
  projects: Project[];
  currentProjectId: string;
  currentProject: Project | null;
  isLoading: boolean;

  // Handlers
  switchProject: (id: string) => Promise<void>;
  createProject: (name: string, description: string) => Promise<Project>;
  updateProject: (project: Project) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  addToProject: (
    artifacts: {
      requirements: string[];
      useCases: string[];
      testCases: string[];
      information: string[];
      risks?: string[];
    },
    targetProjectId?: string
  ) => Promise<void>;
}

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const {
    projects,
    currentProjectId,
    isLoading,
    isReady,
    createProject: fsCreateProject,
    saveProject,
    deleteProject: fsDeleteProject,
    setCurrentProject,
  } = useFileSystem();

  const currentProject = projects.find((p) => p.id === currentProjectId) || projects[0] || null;

  const switchProject = useCallback(
    async (projectId: string) => {
      await setCurrentProject(projectId);
    },
    [setCurrentProject]
  );

  const createProject = useCallback(
    async (name: string, description: string): Promise<Project> => {
      const project = await fsCreateProject(name, description);
      await setCurrentProject(project.id);
      return project;
    },
    [fsCreateProject, setCurrentProject]
  );

  const updateProject = useCallback(
    async (project: Project) => {
      await saveProject({ ...project, lastModified: Date.now() });
    },
    [saveProject]
  );

  const deleteProject = useCallback(
    async (projectId: string) => {
      await fsDeleteProject(projectId);

      // If we deleted the current project, switch to another non-deleted one
      if (currentProjectId === projectId) {
        const remainingProjects = projects.filter((p) => p.id !== projectId && !p.isDeleted);
        if (remainingProjects.length > 0) {
          await setCurrentProject(remainingProjects[0].id);
        } else {
          await setCurrentProject('');
        }
      }
    },
    [fsDeleteProject, currentProjectId, projects, setCurrentProject]
  );

  const addToProject = useCallback(
    async (
      artifacts: {
        requirements: string[];
        useCases: string[];
        testCases: string[];
        information: string[];
        risks?: string[];
      },
      targetProjectId: string = currentProjectId
    ) => {
      const project = projects.find((p) => p.id === targetProjectId);
      if (!project) return;

      const updatedProject: Project = {
        ...project,
        requirementIds: Array.from(new Set([...project.requirementIds, ...artifacts.requirements])),
        useCaseIds: Array.from(new Set([...project.useCaseIds, ...artifacts.useCases])),
        testCaseIds: Array.from(new Set([...project.testCaseIds, ...artifacts.testCases])),
        informationIds: Array.from(new Set([...project.informationIds, ...artifacts.information])),
        riskIds: Array.from(new Set([...project.riskIds, ...(artifacts.risks || [])])),
        lastModified: Date.now(),
      };

      await saveProject(updatedProject);
    },
    [currentProjectId, projects, saveProject]
  );

  const value: ProjectContextValue = {
    projects,
    currentProjectId,
    currentProject,
    isLoading: isLoading || !isReady,
    switchProject,
    createProject,
    updateProject,
    deleteProject,
    addToProject,
  };

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
};

export const useProject = (): ProjectContextValue => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};
