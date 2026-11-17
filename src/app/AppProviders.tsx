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
  CustomAttributeProvider,
  RisksProvider,
  BaselinesProvider,
  DocumentsProvider,
} from './providers';
import { StoreProvider } from '../state';

export const AppProviders: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <StoreProvider>
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
                            <DocumentsProvider>
                              <BaselinesProvider>
                                <ImportExportProvider>{children}</ImportExportProvider>
                              </BaselinesProvider>
                            </DocumentsProvider>
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
    </StoreProvider>
  );
};
