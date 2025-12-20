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
  BackgroundTasksProvider,
  ToastProvider,
  CustomAttributeProvider,
  RisksProvider,
  BaselinesProvider,
} from './providers';

export const AppProviders: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <ToastProvider>
      <BackgroundTasksProvider>
        <FileSystemProvider>
          <UserProvider>
            <ProjectProvider>
              <UIProvider>
                <GlobalStateProvider>
                  <CustomAttributeProvider>
                    <RequirementsProvider>
                      <UseCasesProvider>
                        <TestCasesProvider>
                          <InformationProvider>
                            <RisksProvider>
                              <BaselinesProvider>
                                <ImportExportProvider>{children}</ImportExportProvider>
                              </BaselinesProvider>
                            </RisksProvider>
                          </InformationProvider>
                        </TestCasesProvider>
                      </UseCasesProvider>
                    </RequirementsProvider>
                  </CustomAttributeProvider>
                </GlobalStateProvider>
              </UIProvider>
            </ProjectProvider>
          </UserProvider>
        </FileSystemProvider>
      </BackgroundTasksProvider>
    </ToastProvider>
  );
};
