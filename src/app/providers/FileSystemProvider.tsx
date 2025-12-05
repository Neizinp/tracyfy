import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fileSystemService } from '../../services/fileSystemService';
import { realGitService } from '../../services/realGitService';
import type { Requirement, UseCase, TestCase, Information } from '../../types';

interface FileSystemContextValue {
    isReady: boolean;
    isLoading: boolean;
    directoryName: string | null;
    error: string | null;
    selectDirectory: () => Promise<void>;
    loadedData: {
        requirements: Requirement[];
        useCases: UseCase[];
        testCases: TestCase[];
        information: Information[];
    } | null;
    saveArtifact: (
        type: 'requirements' | 'usecases' | 'testcases' | 'information',
        id: string,
        artifact: Requirement | UseCase | TestCase | Information,
        isNew: boolean
    ) => Promise<void>;
    deleteArtifact: (
        type: 'requirements' | 'usecases' | 'testcases' | 'information',
        id: string
    ) => Promise<void>;
}

const FileSystemContext = createContext<FileSystemContextValue | undefined>(undefined);

export const FileSystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isReady, setIsReady] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [directoryName, setDirectoryName] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loadedData, setLoadedData] = useState<FileSystemContextValue['loadedData']>(null);

    // Try to restore previously selected directory on mount
    useEffect(() => {
        const tryRestore = async () => {
            if (!fileSystemService.isSupported()) {
                setError('File System Access API is not supported. Please use Chrome, Edge, or Opera.');
                setIsLoading(false);
                return;
            }

            try {
                const result = await fileSystemService.restoreDirectory();
                if (result && result.handle) {
                    // Initialize git with the restored directory
                    const gitInitialized = await realGitService.init(result.handle);
                    if (gitInitialized) {
                        setDirectoryName(fileSystemService.getDirectoryName());

                        // Load data from disk
                        const data = await realGitService.loadAllArtifacts();
                        setLoadedData(data);
                        setIsReady(true);
                    }
                }
            } catch (err) {
                console.error('Failed to restore directory:', err);
            }

            setIsLoading(false);
        };

        tryRestore();
    }, []);

    const selectDirectory = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await fileSystemService.selectDirectory();

            // Initialize git
            const gitInitialized = await realGitService.init(result.handle);
            if (!gitInitialized) {
                setError('Git initialization was cancelled. A git repository is required.');
                setIsLoading(false);
                return;
            }

            setDirectoryName(fileSystemService.getDirectoryName());

            // Load existing data
            const data = await realGitService.loadAllArtifacts();
            setLoadedData(data);
            setIsReady(true);
        } catch (err) {
            setError((err as Error).message);
        }

        setIsLoading(false);
    }, []);

    const saveArtifact = useCallback(async (
        type: 'requirements' | 'usecases' | 'testcases' | 'information',
        id: string,
        artifact: Requirement | UseCase | TestCase | Information,
        isNew: boolean
    ) => {
        if (!isReady) {
            throw new Error('Filesystem not ready');
        }
        await realGitService.saveArtifact(type, id, artifact, isNew);
    }, [isReady]);

    const deleteArtifact = useCallback(async (
        type: 'requirements' | 'usecases' | 'testcases' | 'information',
        id: string
    ) => {
        if (!isReady) {
            throw new Error('Filesystem not ready');
        }
        await realGitService.deleteArtifact(type, id);
    }, [isReady]);

    return (
        <FileSystemContext.Provider value={{
            isReady,
            isLoading,
            directoryName,
            error,
            selectDirectory,
            loadedData,
            saveArtifact,
            deleteArtifact
        }}>
            {children}
        </FileSystemContext.Provider>
    );
};

export const useFileSystem = (): FileSystemContextValue => {
    const context = useContext(FileSystemContext);
    if (!context) {
        throw new Error('useFileSystem must be used within a FileSystemProvider');
    }
    return context;
};
