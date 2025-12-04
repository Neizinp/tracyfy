import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useGitOperations as useGitOperationsHook } from '../../hooks/useGitOperations';
import { useGlobalState } from './GlobalStateProvider';
import { useProject } from './ProjectProvider';
import type { Version } from '../../types';

interface GitContextValue {
    handlePendingChangesChange: (changes: any[]) => void;
    handleCommitArtifact: (artifactId: string, type: string, message: string) => Promise<void>;
    handleCreateBaseline: (name?: string) => Promise<void>;
    handleViewBaselineHistory: (baselineId: string) => void;
    handleRestoreVersion: (versionId: string) => Promise<void>;
    versions: Version[];
    setVersions: React.Dispatch<React.SetStateAction<Version[]>>;
}

const GitContext = createContext<GitContextValue | undefined>(undefined);

export const GitProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { projects, currentProjectId } = useProject();
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

    const gitOps = useGitOperationsHook({
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
        <GitContext.Provider value={gitOps}>
            {children}
        </GitContext.Provider>
    );
};

export const useGit = (): GitContextValue => {
    const context = useContext(GitContext);
    if (context === undefined) {
        throw new Error('useGit must be used within a GitProvider');
    }
    return context;
};
