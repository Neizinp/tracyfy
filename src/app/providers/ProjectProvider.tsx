import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useProjectManager } from '../../hooks/useProjectManager';
import type { Project } from '../../types';

interface ProjectContextValue {
  // State
  projects: Project[];
  currentProjectId: string;
  currentProject: Project;
  isLoading: boolean;
  initialGlobalState: any;

  // Handlers
  switchProject: (id: string) => void;
  createProject: (name: string, description: string) => Promise<Project>;
  updateProject: (id: string, name: string, description: string) => void;
  deleteProject: (id: string) => void;
  resetToDemo: () => Promise<void>;
  addToProject: (
    artifacts: {
      requirements: string[];
      useCases: string[];
      testCases: string[];
      information: string[];
    },
    targetProjectId?: string
  ) => Promise<void>;

  // Internal
  setProjects: (projects: Project[] | ((prev: Project[]) => Project[])) => void;
  setHasInitializedProjects: (initialized: boolean) => void;
}

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const projectManager = useProjectManager();

  const currentProject =
    projectManager.projects.find((p) => p.id === projectManager.currentProjectId) ||
    projectManager.projects[0];

  const value: ProjectContextValue = {
    // State
    projects: projectManager.projects,
    currentProjectId: projectManager.currentProjectId,
    currentProject,
    isLoading: projectManager.isLoading,
    initialGlobalState: projectManager.initialGlobalState,

    // Handlers
    switchProject: projectManager.handleSwitchProject,
    createProject: projectManager.handleCreateProjectSubmit,
    updateProject: projectManager.handleUpdateProject,
    deleteProject: projectManager.handleDeleteProject,
    resetToDemo: projectManager.handleResetToDemo,
    addToProject: projectManager.handleAddToProject,

    // Internal (for other providers)
    setProjects: projectManager.setProjects,
    setHasInitializedProjects: projectManager.setHasInitializedProjects,
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
