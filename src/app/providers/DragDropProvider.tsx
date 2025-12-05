import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useDragAndDrop as useDragAndDropHook } from '../../hooks/useDragAndDrop';
import { useGlobalState } from './GlobalStateProvider';
import { useProject } from './ProjectProvider';
import { useFileSystem } from './FileSystemProvider';
import { useUI } from './UIProvider';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import type { SensorDescriptor } from '@dnd-kit/core';
import type { Project } from '../../types';

interface DragDropContextValue {
  sensors: SensorDescriptor<any>[];
  activeDragItem: any | null;
  handleDragStart: (event: DragStartEvent) => void;
  handleDragEnd: (event: DragEndEvent) => void;
}

const DragDropContext = createContext<DragDropContextValue | undefined>(undefined);

export const DragDropProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentProjectId, addToProject: handleAddToProjectInternal, projects } = useProject();
  const { saveProject } = useFileSystem();
  const { globalLibrarySelection } = useUI();
  const {
    requirements,
    setRequirements,
    globalRequirements,
    globalUseCases,
    globalTestCases,
    globalInformation,
  } = useGlobalState();

  // Create a setProjects-like function that updates via saveProject
  const handleProjectUpdate = async (
    projectsOrUpdater: Project[] | ((prev: Project[]) => Project[])
  ) => {
    const updatedProjects =
      typeof projectsOrUpdater === 'function' ? projectsOrUpdater(projects) : projectsOrUpdater;
    // Find the changed project and save it
    for (const project of updatedProjects) {
      const original = projects.find((p) => p.id === project.id);
      if (!original || JSON.stringify(original) !== JSON.stringify(project)) {
        await saveProject(project);
      }
    }
  };

  const dragDrop = useDragAndDropHook({
    requirements,
    setRequirements,
    globalRequirements,
    globalUseCases,
    globalTestCases,
    globalInformation,
    globalLibrarySelection,
    currentProjectId,
    setProjects: handleProjectUpdate,
    handleAddToProject: handleAddToProjectInternal,
  });

  return <DragDropContext.Provider value={dragDrop}>{children}</DragDropContext.Provider>;
};

export const useDragDrop = (): DragDropContextValue => {
  const context = useContext(DragDropContext);
  if (context === undefined) {
    throw new Error('useDragDrop must be used within a DragDropProvider');
  }
  return context;
};
