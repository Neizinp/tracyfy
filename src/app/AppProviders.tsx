import React from 'react';
import type { ReactNode } from 'react';
import {
  ProjectProvider,
  UIProvider,
  GlobalStateProvider,
  RequirementsProvider,
  UseCasesProvider,
  TestCasesProvider,
  InformationProvider,
  DragDropProvider,
  ImportExportProvider,
  FileSystemProvider,
} from './providers';

export const AppProviders: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <FileSystemProvider>
      <ProjectProvider>
        <UIProvider>
          <GlobalStateProvider>
            <RequirementsProvider>
              <UseCasesProvider>
                <TestCasesProvider>
                  <InformationProvider>
                    <DragDropProvider>
                      <ImportExportProvider>{children}</ImportExportProvider>
                    </DragDropProvider>
                  </InformationProvider>
                </TestCasesProvider>
              </UseCasesProvider>
            </RequirementsProvider>
          </GlobalStateProvider>
        </UIProvider>
      </ProjectProvider>
    </FileSystemProvider>
  );
};
