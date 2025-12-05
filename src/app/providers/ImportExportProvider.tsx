import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useImportExport as useImportExportHook } from '../../hooks/useImportExport';
import { useGlobalState } from './GlobalStateProvider';
import { useProject } from './ProjectProvider';

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
        links,
        setRequirements,
        setUseCases,
        setTestCases,
        setInformation,
        setLinks
    } = useGlobalState();

    const importExport = useImportExportHook({
        currentProjectId,
        projects,
        requirements,
        useCases,
        testCases,
        information,
        links,
        setRequirements,
        setUseCases,
        setTestCases,
        setInformation,
        setLinks
    });

    return (
        <ImportExportContext.Provider value={importExport}>
            {children}
        </ImportExportContext.Provider>
    );
};

export const useImportExport = (): ImportExportContextValue => {
    const context = useContext(ImportExportContext);
    if (context === undefined) {
        throw new Error('useImportExport must be used within an ImportExportProvider');
    }
    return context;
};
