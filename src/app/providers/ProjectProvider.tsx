import React, { createContext, useContext, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useFileSystem } from './FileSystemProvider';
import type { Project } from '../../types';

interface ProjectContextValue {
  /** The project in the open folder (one folder is one project) */
  project: Project;
  isLoading: boolean;
  /** Rename the project or change its description (saved to tracyfy.yaml) */
  updateProject: (project: Project) => Promise<void>;
}

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { project, isLoading, isReady, saveProject } = useFileSystem();

  const updateProject = useCallback(
    async (updated: Project) => {
      const name = updated.name.trim();
      if (!name) throw new Error('The project needs a name');
      await saveProject({ name, description: updated.description.trim() });
    },
    [saveProject]
  );

  const value = useMemo<ProjectContextValue>(
    () => ({ project, isLoading: isLoading || !isReady, updateProject }),
    [project, isLoading, isReady, updateProject]
  );

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
};

export const useProject = (): ProjectContextValue => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};
