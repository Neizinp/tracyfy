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
  ImportExportProvider,
  FileSystemProvider,
  UserProvider,
} from './providers';

export const AppProviders: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <FileSystemProvider>
      <UserProvider>
        <ProjectProvider>
          <UIProvider>
            <GlobalStateProvider>
              <RequirementsProvider>
                <UseCasesProvider>
                  <TestCasesProvider>
                    <InformationProvider>
                      <ImportExportProvider>{children}</ImportExportProvider>
                    </InformationProvider>
                  </TestCasesProvider>
                </UseCasesProvider>
              </RequirementsProvider>
            </GlobalStateProvider>
          </UIProvider>
        </ProjectProvider>
      </UserProvider>
    </FileSystemProvider>
  );
};
