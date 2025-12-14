import React, { createContext, useContext, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useImportExport as useImportExportHook } from '../../hooks/useImportExport';
import { useGlobalState } from './GlobalStateProvider';
import { useProject } from './ProjectProvider';
import { useBackgroundTasks } from './BackgroundTasksProvider';

interface ImportExportContextValue {
  handleExport: () => void;
  handleImport: () => void;
  handleImportExcel: () => void;
}

const ImportExportContext = createContext<ImportExportContextValue | undefined>(undefined);

export const ImportExportProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentProjectId, projects } = useProject();
  const {
    requirements,
    useCases,
    testCases,
    information,
    setRequirements,
    setUseCases,
    setTestCases,
    setInformation,
  } = useGlobalState();
  const { startTask, endTask } = useBackgroundTasks();

  const importExportHook = useImportExportHook({
    currentProjectId,
    projects,
    requirements,
    useCases,
    testCases,
    information,
    setRequirements,
    setUseCases,
    setTestCases,
    setInformation,
  });

  // Wrap handleExport with progress status
  const handleExport = useCallback(async () => {
    const taskId = startTask('Exporting JSON...');
    try {
      await importExportHook.handleExport();
    } finally {
      endTask(taskId);
    }
  }, [importExportHook, startTask, endTask]);

  const value: ImportExportContextValue = {
    handleExport,
    handleImport: importExportHook.handleImport,
    handleImportExcel: importExportHook.handleImportExcel,
  };

  return <ImportExportContext.Provider value={value}>{children}</ImportExportContext.Provider>;
};

export const useImportExport = (): ImportExportContextValue => {
  const context = useContext(ImportExportContext);
  if (context === undefined) {
    throw new Error('useImportExport must be used within an ImportExportProvider');
  }
  return context;
};
