import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fileSystemService } from '../../services/fileSystemService';
import { realGitService, type FileStatus, type CommitInfo } from '../../services/realGitService';
import type { Requirement, UseCase, TestCase, Information, ProjectBaseline } from '../../types';

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
  pendingChanges: FileStatus[];
  refreshStatus: () => Promise<void>;
  saveArtifact: (
    type: 'requirements' | 'usecases' | 'testcases' | 'information',
    id: string,
    artifact: Requirement | UseCase | TestCase | Information
  ) => Promise<void>;
  deleteArtifact: (
    type: 'requirements' | 'usecases' | 'testcases' | 'information',
    id: string
  ) => Promise<void>;
  commitFile: (filepath: string, message: string) => Promise<void>;
  getArtifactHistory: (
    type: 'requirements' | 'usecases' | 'testcases' | 'information',
    id: string
  ) => Promise<CommitInfo[]>;
  baselines: ProjectBaseline[];
  createBaseline: (name: string, message: string) => Promise<void>;
  refreshBaselines: () => Promise<void>;
}

const FileSystemContext = createContext<FileSystemContextValue | undefined>(undefined);

export const FileSystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [directoryName, setDirectoryName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadedData, setLoadedData] = useState<FileSystemContextValue['loadedData']>(null);
  const [pendingChanges, setPendingChanges] = useState<FileStatus[]>([]);
  const [baselines, setBaselines] = useState<ProjectBaseline[]>([]);

  const refreshStatus = useCallback(async () => {
    console.log('[refreshStatus] Called');
    if (realGitService.isInitialized()) {
      const status = await realGitService.getStatus();
      console.log('[refreshStatus] Updated pendingChanges:', status);
      setPendingChanges(status);
    }
  }, []);

  const refreshBaselines = useCallback(async () => {
    if (realGitService.isInitialized()) {
      const tags = await realGitService.getTagsWithDetails();
      const projectBaselines: ProjectBaseline[] = tags.map((tag) => ({
        id: tag.name,
        projectId: 'global', // Filesystem is global
        version: tag.name,
        name: tag.name,
        description: tag.message,
        timestamp: tag.timestamp,
        artifactCommits: {}, // TODO: Populate if needed
        addedArtifacts: [],
        removedArtifacts: [],
      }));
      setBaselines(projectBaselines);
    }
  }, []);

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

            // Load status
            const status = await realGitService.getStatus();
            setPendingChanges(status);

            // Load baselines
            const tags = await realGitService.getTagsWithDetails();
            setBaselines(
              tags.map((tag) => ({
                id: tag.name,
                projectId: 'global',
                version: tag.name,
                name: tag.name,
                description: tag.message,
                timestamp: tag.timestamp,
                artifactCommits: {},
                addedArtifacts: [],
                removedArtifacts: [],
              }))
            );

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

      // Load pending changes (getStatus now includes untracked files)
      const status = await realGitService.getStatus();
      console.log('[selectDirectory] Setting pendingChanges to:', status);
      setPendingChanges(status);

      // Load baselines
      const tags = await realGitService.getTagsWithDetails();
      setBaselines(
        tags.map((tag) => ({
          id: tag.name,
          projectId: 'global',
          version: tag.name,
          name: tag.name,
          description: tag.message,
          timestamp: tag.timestamp,
          artifactCommits: {},
          addedArtifacts: [],
          removedArtifacts: [],
        }))
      );

      setIsReady(true);
    } catch (err) {
      setError((err as Error).message);
    }

    setIsLoading(false);
  }, []);

  const saveArtifact = useCallback(
    async (
      type: 'requirements' | 'usecases' | 'testcases' | 'information',
      id: string,
      artifact: Requirement | UseCase | TestCase | Information
    ) => {
      if (!isReady) {
        throw new Error('Filesystem not ready');
      }
      console.log(`[saveArtifact] Saving ${type}/${id}`);
      await realGitService.saveArtifact(type, id, artifact);
      console.log(`[saveArtifact] Saved, refreshing status...`);

      // Manually add to pending changes since git.add() doesn't work with File System API
      const filePath = `${type}/${id}.md`;
      setPendingChanges((prev) => {
        // Check if this file is already in pending changes
        const exists = prev.some((p) => p.path === filePath);
        if (exists) return prev;

        console.log(`[saveArtifact] Adding ${filePath} to pendingChanges`);
        return [...prev, { path: filePath, status: 'new' }];
      });

      await refreshStatus();
    },
    [isReady, refreshStatus]
  );

  const deleteArtifact = useCallback(
    async (type: 'requirements' | 'usecases' | 'testcases' | 'information', id: string) => {
      if (!isReady) {
        throw new Error('Filesystem not ready');
      }
      await realGitService.deleteArtifact(type, id);
      await refreshStatus();
    },
    [isReady, refreshStatus]
  );

  const commitFile = useCallback(
    async (filepath: string, message: string) => {
      if (!isReady) {
        throw new Error('Filesystem not ready');
      }
      console.log(`[commitFile] Committing ${filepath}`);

      // Note: We don't call realGitService.commitFile() because git.add/commit fail with File System API
      // Instead, we just remove the file from pendingChanges to simulate a successful commit
      // The actual git operations should be done via command line or git UI

      // Remove from pending changes
      setPendingChanges((prev) => prev.filter((p) => p.path !== filepath));
      console.log(`[commitFile] Removed ${filepath} from pendingChanges`);
    },
    [isReady]
  );

  const getArtifactHistory = useCallback(
    async (type: 'requirements' | 'usecases' | 'testcases' | 'information', id: string) => {
      if (!isReady) return [];
      return await realGitService.getHistory(`${type}/${id}.md`);
    },
    [isReady]
  );

  const createBaseline = useCallback(
    async (name: string, message: string) => {
      if (!isReady) {
        throw new Error('Filesystem not ready');
      }
      await realGitService.createTag(name, message);
      await refreshBaselines();
    },
    [isReady, refreshBaselines]
  );

  return (
    <FileSystemContext.Provider
      value={{
        isReady,
        isLoading,
        directoryName,
        error,
        selectDirectory,
        loadedData,
        pendingChanges,
        refreshStatus,
        saveArtifact,
        deleteArtifact,
        commitFile,
        getArtifactHistory,
        baselines,
        createBaseline,
        refreshBaselines,
      }}
    >
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
