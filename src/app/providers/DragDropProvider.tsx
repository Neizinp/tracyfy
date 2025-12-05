import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useDragAndDrop as useDragAndDropHook } from '../../hooks/useDragAndDrop';
import { useGlobalState } from './GlobalStateProvider';
import { useProject } from './ProjectProvider';
import { useUI } from './UIProvider';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import type { SensorDescriptor } from '@dnd-kit/core';

interface DragDropContextValue {
  sensors: SensorDescriptor<any>[];
  activeDragItem: any | null;
  handleDragStart: (event: DragStartEvent) => void;
  handleDragEnd: (event: DragEndEvent) => void;
}

const DragDropContext = createContext<DragDropContextValue | undefined>(undefined);

export const DragDropProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentProjectId, setProjects, addToProject: handleAddToProjectInternal } = useProject();
  const { globalLibrarySelection } = useUI();
  const {
    requirements,
    setRequirements,
    globalRequirements,
    globalUseCases,
    globalTestCases,
    globalInformation,
  } = useGlobalState();

  const dragDrop = useDragAndDropHook({
    requirements,
    setRequirements,
    globalRequirements,
    globalUseCases,
    globalTestCases,
    globalInformation,
    globalLibrarySelection,
    currentProjectId,
    setProjects,
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
