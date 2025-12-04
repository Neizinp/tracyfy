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
    GitProvider,
    DragDropProvider,
    ImportExportProvider
} from './providers';

export const AppProviders: React.FC<{ children: ReactNode }> = ({ children }) => {
    return (
        <ProjectProvider>
            <UIProvider>
                <GlobalStateProvider>
                    <RequirementsProvider>
                        <UseCasesProvider>
                            <TestCasesProvider>
                                <InformationProvider>
                                    <GitProvider>
                                        <DragDropProvider>
                                            <ImportExportProvider>
                                                {children}
                                            </ImportExportProvider>
                                        </DragDropProvider>
                                    </GitProvider>
                                </InformationProvider>
                            </TestCasesProvider>
                        </UseCasesProvider>
                    </RequirementsProvider>
                </GlobalStateProvider>
            </UIProvider>
        </ProjectProvider>
    );
};
