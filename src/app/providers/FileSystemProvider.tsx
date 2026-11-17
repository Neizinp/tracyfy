import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import { debug } from '../../utils/debug';
import { fileSystemService } from '../../services/fileSystemService';
import {
  realGitService,
  type FileStatus,
  type CommitInfo,
  type PullResult,
} from '../../services/realGitService';
import { repository } from '../../storage/repository';
import type {
  Requirement,
  UseCase,
  TestCase,
  Information,
  Link,
  LinkType,
  Project,
  Risk,
  ArtifactDocument,
} from '../../types';
import type { ArtifactKindId } from '../../domain/artifactKinds';
import { STORED_TYPES, type StoredType } from '../../services/storedTypes';
import type { FileProblem } from '../../services/baseArtifactService';
import { useAppStore } from '../../state';

interface FileSystemContextValue {
  isReady: boolean;
  isLoading: boolean;
  isApiSupported: boolean;
  directoryName: string | null;
  error: string | null;
  selectDirectory: () => Promise<void>;
  changeDirectory: () => Promise<void>;
  // Loaded data from disk
  /** The project in this folder (its name and description) */
  project: Project;
  requirements: Requirement[];
  useCases: UseCase[];
  testCases: TestCase[];
  information: Information[];
  risks: Risk[];
  documents: ArtifactDocument[];
  links: Link[];
  /** Files that could not be read (shown to the user, never silently skipped) */
  fileProblems: FileProblem[];
  // Git-related
  pendingChanges: FileStatus[];
  /** Set when git status could not be read (shown instead of "No pending changes") */
  statusError: string | null;
  refreshStatus: () => Promise<void>;
  // CRUD operations (save to disk)
  saveRequirement: (requirement: Requirement) => Promise<void>;
  saveUseCase: (useCase: UseCase) => Promise<void>;
  saveTestCase: (testCase: TestCase) => Promise<void>;
  saveInformation: (info: Information) => Promise<void>;
  saveRisk: (risk: Risk) => Promise<void>;
  saveDocument: (document: ArtifactDocument) => Promise<void>;
  saveProject: (project: Project) => Promise<void>;
  saveLink: (link: Link) => Promise<void>;
  deleteLink: (id: string) => Promise<void>;
  /** Create a link (a pending change like any other file); updates provider state at once */
  createLink: (sourceId: string, targetId: string, type: LinkType) => Promise<Link>;
  updateLink: (id: string, updates: Partial<Link>) => Promise<Link | null>;
  getNextId: (type: StoredType) => Promise<string>;
  // Reload from disk
  reloadData: () => Promise<void>;
  // Git operations
  /** Commit one file; the author is the repository's user.name */
  commitFile: (filepath: string, message: string) => Promise<void>;
  revertFile: (filepath: string) => Promise<void>;
  getArtifactHistory: (kind: ArtifactKindId, id: string) => Promise<CommitInfo[]>;
  readFileAtCommit: (filepath: string, commitHash: string) => Promise<string | null>;
  push: () => Promise<void>;
  pull: () => Promise<PullResult>;
  hasRemote: () => Promise<boolean>;
}

export const FileSystemContext = createContext<FileSystemContextValue | undefined>(undefined);

// Check if we're in E2E test mode (skip disk operations)
interface ExtendedWindow extends Window {
  __E2E_TEST_MODE__?: boolean;
}

const isE2EMode = () =>
  typeof window !== 'undefined' && (window as unknown as ExtendedWindow).__E2E_TEST_MODE__;

// Check E2E mode once at module load time for initial state
const initialE2EMode = isE2EMode() || false;

/** Before a folder is opened */
const NO_PROJECT: Project = { name: '', description: '' };

export const FileSystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isReady, setIsReady] = useState(initialE2EMode);
  const [isLoading, setIsLoading] = useState(!initialE2EMode);

  const [directoryName, setDirectoryName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingChanges, setPendingChanges] = useState<FileStatus[]>([]);
  const [statusError, setStatusError] = useState<string | null>(null);

  /** git status, recording (not throwing) a failure so the UI can show it */
  const loadStatus = useCallback(async (): Promise<FileStatus[]> => {
    try {
      const status = await repository.status();
      setStatusError(null);
      return status;
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : String(err));
      return [];
    }
  }, []);
  const [information, setInformation] = useState<Information[]>([]);
  const [risks, setRisks] = useState<Risk[]>([]);
  const [documents, setDocuments] = useState<ArtifactDocument[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [fileProblems, setFileProblems] = useState<FileProblem[]>([]);

  // All data from disk
  const [project, setProject] = useState<Project>(NO_PROJECT);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [useCases, setUseCases] = useState<UseCase[]>([]);
  const [testCases, setTestCases] = useState<TestCase[]>([]);

  // Counter for E2E mode to generate unique IDs
  const [e2eCounters, setE2eCounters] = useState<Partial<Record<StoredType, number>>>({});

  // Background tasks for status bar
  const startTask = useAppStore((s) => s.startTask);
  const endTask = useAppStore((s) => s.endTask);

  // Debounce timer for refreshStatus to coalesce rapid calls
  const refreshStatusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const REFRESH_STATUS_DEBOUNCE_MS = 300;

  // A refresh that started earlier must never overwrite the result of a later one
  const statusRequest = useRef(0);

  const refreshStatus = useCallback(async () => {
    // Clear any pending refresh
    if (refreshStatusTimer.current) {
      clearTimeout(refreshStatusTimer.current);
    }

    // Debounce: wait before actually refreshing
    refreshStatusTimer.current = setTimeout(async () => {
      debug.log('[refreshStatus] Executing (debounced)');
      if (realGitService.isInitialized()) {
        const taskId = startTask('Refreshing git status...');
        try {
          const request = ++statusRequest.current;
          const status = await loadStatus();
          debug.log(`[refreshStatus] Received ${status.length} files`);
          if (request === statusRequest.current) setPendingChanges(status);
        } finally {
          endTask(taskId);
        }
      }
    }, REFRESH_STATUS_DEBOUNCE_MS);
  }, [startTask, endTask, loadStatus]);

  // Load all data from disk
  const reloadData = useCallback(async () => {
    const taskId = startTask('Loading data...');
    try {
      const data = await repository.load();
      setProject(data.project);
      setRequirements(data.artifacts.requirement as Requirement[]);
      setUseCases(data.artifacts.useCase as UseCase[]);
      setTestCases(data.artifacts.testCase as TestCase[]);
      setInformation(data.artifacts.information as Information[]);
      setDocuments(data.artifacts.document as ArtifactDocument[]);
      setRisks(data.artifacts.risk as Risk[]);
      setLinks(data.links);
      setFileProblems(data.problems);
    } finally {
      endTask(taskId);
    }
  }, [startTask, endTask]);

  // Try to restore previously selected directory on mount.
  // Runs once per mount: React StrictMode (dev) invokes effects twice, and the
  // effect's deps may change identity, but restoring (git init, counter
  // recalculation, link migration) must not run concurrently or repeatedly.
  const restoreStartedRef = useRef(false);
  useEffect(() => {
    if (restoreStartedRef.current) return;
    restoreStartedRef.current = true;
    const tryRestore = async () => {
      if (!fileSystemService.isSupported()) {
        setError('File System Access API is not supported. Please use Chrome, Edge, or Opera.');
        setIsLoading(false);
        return;
      }

      try {
        // For e2e tests: if E2E_TEST_MODE is set, use in-memory storage
        if (
          typeof window !== 'undefined' &&
          (window as unknown as ExtendedWindow).__E2E_TEST_MODE__
        ) {
          debug.log('[FileSystemProvider] E2E test mode enabled');
          setDirectoryName('E2E Test Directory');
          // Initialize with empty data for E2E tests
          setProject({ name: 'E2E Test Directory', description: '' });
          setRequirements([]);
          setUseCases([]);
          setTestCases([]);
          setInformation([]);
          setRisks([]);
          setDocuments([]);
          setLinks([]);
          setIsReady(true);
          setIsLoading(false);
          return;
        }

        const result = await fileSystemService.restoreDirectory();
        if (result && (result.handle || result.path)) {
          const initTaskId = startTask('Loading project...');
          try {
            // Open the git repository (handle for browser, path for Electron)
            const gitInitialized = await repository.open(result.handle);
            if (gitInitialized) {
              setDirectoryName(fileSystemService.getDirectoryName());

              // Load data and git status in parallel (they're independent)
              const [, status] = await Promise.all([reloadData(), loadStatus()]);
              setPendingChanges(status);

              setIsReady(true);
            }
          } finally {
            endTask(initTaskId);
          }
        }
      } catch (err) {
        // Shown by the folder selector instead of silently asking to pick a folder again
        console.error('Failed to restore directory:', err);
        setError(
          `Could not open the project folder: ${err instanceof Error ? err.message : String(err)}`
        );
      }

      setIsLoading(false);
    };

    tryRestore();
  }, [reloadData, startTask, endTask, loadStatus]);

  const selectDirectory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const taskId = startTask('Loading project...');

    try {
      const result = await fileSystemService.selectDirectory();

      // Check if directory is empty (excluding .git)
      const { isEmpty, entryCount } = await fileSystemService.checkDirectoryEmpty();

      // If directory is not empty, ask for confirmation
      if (!isEmpty) {
        const confirmed = window.confirm(
          `This folder contains ${entryCount} ${entryCount === 1 ? 'item' : 'items'}.\n\n` +
            `Tracyfy will create project files in this folder. Are you sure you want to use this folder?`
        );

        if (!confirmed) {
          // User cancelled, clear the selection
          await fileSystemService.clearDirectory();
          setError('Directory selection was cancelled.');
          setIsLoading(false);
          endTask(taskId);
          return;
        }
      }

      // Open the git repository (handle for browser, path for Electron)
      const gitInitialized = await repository.open(result.handle);
      if (!gitInitialized) {
        setError('Git initialization was cancelled. A git repository is required.');
        setIsLoading(false);
        endTask(taskId);
        return;
      }

      setDirectoryName(fileSystemService.getDirectoryName());

      // Load data and git status in parallel (they're independent)
      const [, status] = await Promise.all([reloadData(), loadStatus()]);
      debug.log('[selectDirectory] Setting pendingChanges to:', status);
      setPendingChanges(status);

      setIsReady(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      endTask(taskId);
      setIsLoading(false);
    }
  }, [reloadData, startTask, endTask, loadStatus]);

  // Save an artifact of any kind, then show it (state follows the disk)
  const setters = useMemo(
    () =>
      ({
        requirement: setRequirements,
        useCase: setUseCases,
        testCase: setTestCases,
        information: setInformation,
        risk: setRisks,
        document: setDocuments,
      }) as unknown as Record<
        ArtifactKindId,
        React.Dispatch<React.SetStateAction<{ id: string }[]>>
      >,
    []
  );

  const saveArtifact = useCallback(
    async (kindId: ArtifactKindId, artifact: { id: string }) => {
      if (!isReady) throw new Error('Filesystem not ready');
      if (!isE2EMode()) {
        await repository.save(kindId, artifact as never);
      }
      setters[kindId]((prev) => {
        const idx = prev.findIndex((a) => a.id === artifact.id);
        if (idx < 0) return [...prev, artifact];
        const updated = [...prev];
        updated[idx] = artifact;
        return updated;
      });
      if (!isE2EMode()) refreshStatus(); // Fire-and-forget for responsive UI
    },
    [isReady, refreshStatus, setters]
  );

  const saveRequirement = useCallback(
    (a: Requirement) => saveArtifact('requirement', a),
    [saveArtifact]
  );
  const saveUseCase = useCallback((a: UseCase) => saveArtifact('useCase', a), [saveArtifact]);
  const saveTestCase = useCallback((a: TestCase) => saveArtifact('testCase', a), [saveArtifact]);
  const saveInformation = useCallback(
    (a: Information) => saveArtifact('information', a),
    [saveArtifact]
  );
  const saveRisk = useCallback((a: Risk) => saveArtifact('risk', a), [saveArtifact]);
  const saveDocument = useCallback(
    (a: ArtifactDocument) => saveArtifact('document', a),
    [saveArtifact]
  );

  // Project (tracyfy.yaml)
  const saveProject = useCallback(
    async (updated: Project) => {
      if (!isReady) throw new Error('Filesystem not ready');
      if (!isE2EMode()) {
        await repository.saveProject(updated);
      }
      setProject(updated);
      if (!isE2EMode()) refreshStatus(); // Fire-and-forget for responsive UI
    },
    [isReady, refreshStatus]
  );

  // CRUD operations - Links
  const upsertLinkState = useCallback((link: Link) => {
    setLinks((prev) => {
      const idx = prev.findIndex((l) => l.id === link.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = link;
        return updated;
      }
      return [...prev, link];
    });
  }, []);

  const saveLink = useCallback(
    async (link: Link) => {
      if (!isReady) throw new Error('Filesystem not ready');
      if (!isE2EMode()) {
        await repository.saveLink(link);
      }
      upsertLinkState(link);
      if (!isE2EMode()) refreshStatus(); // Fire-and-forget for responsive UI
    },
    [isReady, refreshStatus, upsertLinkState]
  );

  const e2eLinkCounter = useRef(0);

  const createLink = useCallback(
    async (sourceId: string, targetId: string, type: LinkType) => {
      if (!isReady) throw new Error('Filesystem not ready');
      let link: Link;
      if (isE2EMode()) {
        const now = Date.now();
        link = {
          id: `LINK-${String(++e2eLinkCounter.current).padStart(3, '0')}`,
          sourceId,
          targetId,
          type,
          dateCreated: now,
          lastModified: now,
          revision: '01',
        };
      } else {
        link = await repository.createLink(sourceId, targetId, type);
      }
      upsertLinkState(link);
      if (!isE2EMode()) refreshStatus();
      return link;
    },
    [isReady, refreshStatus, upsertLinkState]
  );

  const updateLink = useCallback(
    async (id: string, updates: Partial<Link>) => {
      if (!isReady) throw new Error('Filesystem not ready');
      const updated = await repository.updateLink(id, updates);
      if (updated) upsertLinkState(updated);
      refreshStatus();
      return updated;
    },
    [isReady, refreshStatus, upsertLinkState]
  );

  const deleteLink = useCallback(
    async (id: string) => {
      if (!isReady) throw new Error('Filesystem not ready');
      if (!isE2EMode()) {
        await repository.deleteLink(id);
      }
      setLinks((prev) => prev.filter((l) => l.id !== id));
      if (!isE2EMode()) refreshStatus(); // Fire-and-forget for responsive UI
    },
    [isReady, refreshStatus]
  );

  // Get next ID
  const getNextId = useCallback(
    async (type: StoredType): Promise<string> => {
      if (isE2EMode()) {
        // In E2E mode, use local counter
        const nextNum = (e2eCounters[type] ?? 0) + 1;
        setE2eCounters((prev) => ({ ...prev, [type]: nextNum }));
        return `${STORED_TYPES[type].idPrefix}-${String(nextNum).padStart(3, '0')}`;
      }
      return repository.nextId(type);
    },
    [e2eCounters]
  );

  // Git operations
  const commitFile = useCallback(
    async (filepath: string, message: string) => {
      if (!isReady) throw new Error('Filesystem not ready');
      if (isE2EMode()) return; // Skip git operations in E2E mode
      debug.log(`[commitFile] Committing ${filepath} with message: ${message}`);
      await repository.commit(filepath, message);
      // Trigger sync status update
      window.dispatchEvent(new CustomEvent('git-check'));
    },
    [isReady]
  );

  const revertFile = useCallback(
    async (filepath: string) => {
      debug.log('[revertFile] Called for:', filepath);
      if (!isReady) throw new Error('Filesystem not ready');
      if (isE2EMode()) {
        debug.log('[revertFile] E2E mode, skipping');
        return;
      }

      try {
        await repository.revert(filepath);
        debug.log('[revertFile] Successfully reverted.');
        // Note: git-status-changed event is dispatched by revertFile which triggers refreshStatus
        // We reload data to pick up the reverted content
        await reloadData();
      } catch (err) {
        console.error('[revertFile] Failed:', err);
        throw err;
      }
    },
    [isReady, reloadData]
  );

  const getArtifactHistory = useCallback(
    async (kindId: ArtifactKindId, id: string) => {
      if (!isReady || isE2EMode()) return [];
      return await repository.history(kindId, id);
    },
    [isReady]
  );

  const readFileAtCommit = useCallback(async (path: string, hash: string) => {
    if (isE2EMode()) return null;
    return await repository.readAt(path, hash);
  }, []);

  const push = useCallback(async () => {
    return await repository.push();
  }, []);

  const pull = useCallback(async () => {
    const result = await repository.pull();
    if (result.success) {
      // The pull changed files on disk: reload so the app (and the next save)
      // works on the pulled data instead of stale in-memory state
      await reloadData();
      refreshStatus();
    }
    return result;
  }, [reloadData, refreshStatus]);

  const hasRemote = useCallback(async () => {
    return await repository.hasRemote();
  }, []);

  const changeDirectory = useCallback(async () => {
    // Clear the stored directory
    await fileSystemService.clearDirectory();

    // Reset all state
    setIsReady(false);
    setIsLoading(false); // Set to false so DirectorySelector shows selection UI, not loading spinner
    setDirectoryName(null);
    setError(null);
    setPendingChanges([]);
    setProject(NO_PROJECT);
    setRequirements([]);
    setUseCases([]);
    setTestCases([]);
    setInformation([]);
    setRisks([]);
    setDocuments([]);
    setLinks([]);
    setFileProblems([]);
  }, []);

  // Static capability check; no need to recompute per render
  const isApiSupported = fileSystemService.isSupported();

  const value = useMemo(
    () => ({
      isReady,
      isLoading,
      isApiSupported,
      directoryName,
      error,
      selectDirectory,
      changeDirectory,
      // Data
      project,
      requirements,
      useCases,
      testCases,
      information,
      risks,
      documents,
      links,
      fileProblems,
      // Git
      pendingChanges,
      statusError,
      refreshStatus,
      // CRUD
      saveRequirement,
      saveUseCase,
      saveTestCase,
      saveInformation,
      saveRisk,
      saveDocument,
      saveProject,
      saveLink,
      deleteLink,
      createLink,
      updateLink,
      getNextId,
      reloadData,
      // Git operations
      commitFile,
      revertFile,
      getArtifactHistory,
      readFileAtCommit,
      push,
      pull,
      hasRemote,
    }),
    [
      updateLink,
      changeDirectory,
      commitFile,
      createLink,
      deleteLink,
      directoryName,
      documents,
      error,
      getArtifactHistory,
      getNextId,
      hasRemote,
      information,
      isApiSupported,
      isLoading,
      isReady,
      links,
      fileProblems,
      pendingChanges,
      statusError,
      project,
      pull,
      push,
      readFileAtCommit,
      refreshStatus,
      reloadData,
      requirements,
      revertFile,
      risks,
      saveDocument,
      saveInformation,
      saveLink,
      saveProject,
      saveRequirement,
      saveRisk,
      saveTestCase,
      saveUseCase,
      selectDirectory,
      testCases,
      useCases,
    ]
  );

  return <FileSystemContext.Provider value={value}>{children}</FileSystemContext.Provider>;
};

export const useFileSystem = (): FileSystemContextValue => {
  const context = useContext(FileSystemContext);
  if (!context) {
    throw new Error('useFileSystem must be used within a FileSystemProvider');
  }
  return context;
};
