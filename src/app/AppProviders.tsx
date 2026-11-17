import React from 'react';
import type { ReactNode } from 'react';
import {
  UIProvider,
  RequirementsProvider,
  UseCasesProvider,
  TestCasesProvider,
  InformationProvider,
  ImportExportProvider,
  RisksProvider,
  DocumentsProvider,
} from './providers';
import { StoreProvider } from '../state';

export const AppProviders: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <StoreProvider>
      <UIProvider>
        <RequirementsProvider>
          <UseCasesProvider>
            <TestCasesProvider>
              <InformationProvider>
                <RisksProvider>
                  <DocumentsProvider>
                    <ImportExportProvider>{children}</ImportExportProvider>
                  </DocumentsProvider>
                </RisksProvider>
              </InformationProvider>
            </TestCasesProvider>
          </UseCasesProvider>
        </RequirementsProvider>
      </UIProvider>
    </StoreProvider>
  );
};
