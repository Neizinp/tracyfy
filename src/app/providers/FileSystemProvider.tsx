import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fileSystemService } from '../../services/fileSystemService';
import { realGitService, type FileStatus, type CommitInfo } from '../../services/realGitService';
import { diskProjectService } from '../../services/diskProjectService';
import { useBackgroundTasks } from './BackgroundTasksProvider';
import type {
  Requirement,
  UseCase,
  TestCase,
  Information,
  ProjectBaseline,
  Project,
} from '../../types';

interface FileSystemContextValue {
  isReady: boolean;
  isLoading: boolean;
  isApiSupported: boolean;
  directoryName: string | null;
  error: string | null;
  selectDirectory: () => Promise<void>;
  // Loaded data from disk
  projects: Project[];
  currentProjectId: string;
  requirements: Requirement[];
  useCases: UseCase[];
  testCases: TestCase[];
  information: Information[];
  // Git-related
  pendingChanges: FileStatus[];
  refreshStatus: () => Promise<void>;
  // CRUD operations (save to disk)
  saveRequirement: (requirement: Requirement) => Promise<void>;
  saveUseCase: (useCase: UseCase) => Promise<void>;
  saveTestCase: (testCase: TestCase) => Promise<void>;
  saveInformation: (info: Information) => Promise<void>;
  deleteRequirement: (id: string) => Promise<void>;
  deleteUseCase: (id: string) => Promise<void>;
  deleteTestCase: (id: string) => Promise<void>;
  deleteInformation: (id: string) => Promise<void>;
  saveProject: (project: Project) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  createProject: (name: string, description: string) => Promise<Project>;
  setCurrentProject: (projectId: string) => Promise<void>;
  getNextId: (type: 'requirements' | 'useCases' | 'testCases' | 'information') => Promise<string>;
  // Reload from disk
  reloadData: () => Promise<void>;
  // Git operations
  commitFile: (filepath: string, message: string, authorName?: string) => Promise<void>;
  getArtifactHistory: (
    type: 'requirements' | 'usecases' | 'testcases' | 'information',
    id: string
  ) => Promise<CommitInfo[]>;
  baselines: ProjectBaseline[];
  createBaseline: (name: string, message: string) => Promise<void>;
  refreshBaselines: () => Promise<void>;
}

export const FileSystemContext = createContext<FileSystemContextValue | undefined>(undefined);

// Check if we're in E2E test mode (skip disk operations)
const isE2EMode = () => typeof window !== 'undefined' && (window as any).__E2E_TEST_MODE__;

export const FileSystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [directoryName, setDirectoryName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingChanges, setPendingChanges] = useState<FileStatus[]>([]);
  const [baselines, setBaselines] = useState<ProjectBaseline[]>([]);

  // All data from disk
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectIdState] = useState<string>('');
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [useCases, setUseCases] = useState<UseCase[]>([]);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [information, setInformation] = useState<Information[]>([]);

  // Counter for E2E mode to generate unique IDs
  const [e2eCounters, setE2eCounters] = useState({ req: 0, uc: 0, tc: 0, info: 0 });

  // Background tasks for status bar
  const { startTask, endTask } = useBackgroundTasks();

  const refreshStatus = useCallback(async () => {
    console.log('[refreshStatus] Called');
    if (realGitService.isInitialized()) {
      const taskId = startTask('Refreshing git status...');
      try {
        const status = await realGitService.getStatus();
        console.log('[refreshStatus] Updated pendingChanges:', status);
        setPendingChanges(status);
      } finally {
        endTask(taskId);
      }
    }
  }, [startTask, endTask]);

  const refreshBaselines = useCallback(async () => {
    if (realGitService.isInitialized()) {
      const tags = await realGitService.getTagsWithDetails();
      const projectBaselines: ProjectBaseline[] = tags.map((tag) => ({
        id: tag.name,
        projectId: 'global',
        version: tag.name,
        name: tag.name,
        description: tag.message,
        timestamp: tag.timestamp,
        artifactCommits: {},
        addedArtifacts: [],
        removedArtifacts: [],
      }));
      setBaselines(projectBaselines);
    }
  }, []);

  // Load all data from disk using diskProjectService
  const reloadData = useCallback(async () => {
    const taskId = startTask('Loading data...');
    try {
      console.log('[reloadData] Loading all data from disk...');
      const data = await diskProjectService.loadAll();
      setProjects(data.projects);
      setCurrentProjectIdState(data.currentProjectId);
      setRequirements(data.requirements);
      setUseCases(data.useCases);
      setTestCases(data.testCases);
      setInformation(data.information);

      // Recalculate counters to make sure they're in sync
      await diskProjectService.recalculateCounters();
      console.log('[reloadData] Data loaded:', {
        projects: data.projects.length,
        requirements: data.requirements.length,
        useCases: data.useCases.length,
        testCases: data.testCases.length,
        information: data.information.length,
      });
    } finally {
      endTask(taskId);
    }
  }, [startTask, endTask]);

  // Try to restore previously selected directory on mount
  useEffect(() => {
    const tryRestore = async () => {
      if (!fileSystemService.isSupported()) {
        setError('File System Access API is not supported. Please use Chrome, Edge, or Opera.');
        setIsLoading(false);
        return;
      }

      try {
        // For e2e tests: if E2E_TEST_MODE is set, use in-memory storage
        if (typeof window !== 'undefined' && (window as any).__E2E_TEST_MODE__) {
          console.log('[FileSystemProvider] E2E test mode enabled');
          setDirectoryName('E2E Test Directory');
          // Initialize with empty data for E2E tests
          setProjects([]);
          setCurrentProjectIdState('');
          setRequirements([]);
          setUseCases([]);
          setTestCases([]);
          setInformation([]);
          setIsReady(true);
          setIsLoading(false);
          return;
        }

        const result = await fileSystemService.restoreDirectory();
        if (result && (result.handle || result.path)) {
          // Initialize git with the restored directory (handle for browser, path for Electron)
          const gitInitialized = await realGitService.init(result.handle);
          if (gitInitialized) {
            setDirectoryName(fileSystemService.getDirectoryName());

            // Initialize disk project service directories
            await diskProjectService.initialize();

            // Load all data from disk
            await reloadData();

            // Load git status
            const status = await realGitService.getStatus();
            setPendingChanges(status);

            // Load baselines
            await refreshBaselines();

            setIsReady(true);
          }
        }
      } catch (err) {
        console.error('Failed to restore directory:', err);
      }

      setIsLoading(false);
    };

    tryRestore();
  }, [reloadData, refreshBaselines]);

  const selectDirectory = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await fileSystemService.selectDirectory();

      // Initialize git (handle for browser, path for Electron)
      const gitInitialized = await realGitService.init(result.handle);
      if (!gitInitialized) {
        setError('Git initialization was cancelled. A git repository is required.');
        setIsLoading(false);
        return;
      }

      setDirectoryName(fileSystemService.getDirectoryName());

      // Initialize disk project service directories
      await diskProjectService.initialize();

      // Load all data from disk
      await reloadData();

      // Load git status
      const status = await realGitService.getStatus();
      console.log('[selectDirectory] Setting pendingChanges to:', status);
      setPendingChanges(status);

      // Load baselines
      await refreshBaselines();

      setIsReady(true);
    } catch (err) {
      setError((err as Error).message);
    }

    setIsLoading(false);
  }, [reloadData, refreshBaselines]);

  // CRUD operations - Requirements
  const saveRequirement = useCallback(
    async (requirement: Requirement) => {
      if (!isReady) throw new Error('Filesystem not ready');
      if (!isE2EMode()) {
        await diskProjectService.saveRequirement(requirement);
      }
      setRequirements((prev) => {
        const idx = prev.findIndex((r) => r.id === requirement.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = requirement;
          return updated;
        }
        return [...prev, requirement];
      });
      if (!isE2EMode()) await refreshStatus();
    },
    [isReady, refreshStatus]
  );

  const deleteRequirement = useCallback(
    async (id: string) => {
      if (!isReady) throw new Error('Filesystem not ready');
      if (!isE2EMode()) {
        await diskProjectService.deleteRequirement(id);
      }
      setRequirements((prev) => prev.filter((r) => r.id !== id));
      if (!isE2EMode()) await refreshStatus();
    },
    [isReady, refreshStatus]
  );

  // CRUD operations - Use Cases
  const saveUseCase = useCallback(
    async (useCase: UseCase) => {
      if (!isReady) throw new Error('Filesystem not ready');
      if (!isE2EMode()) {
        await diskProjectService.saveUseCase(useCase);
      }
      setUseCases((prev) => {
        const idx = prev.findIndex((u) => u.id === useCase.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = useCase;
          return updated;
        }
        return [...prev, useCase];
      });
      if (!isE2EMode()) await refreshStatus();
    },
    [isReady, refreshStatus]
  );

  const deleteUseCase = useCallback(
    async (id: string) => {
      if (!isReady) throw new Error('Filesystem not ready');
      if (!isE2EMode()) {
        await diskProjectService.deleteUseCase(id);
      }
      setUseCases((prev) => prev.filter((u) => u.id !== id));
      if (!isE2EMode()) await refreshStatus();
    },
    [isReady, refreshStatus]
  );

  // CRUD operations - Test Cases
  const saveTestCase = useCallback(
    async (testCase: TestCase) => {
      if (!isReady) throw new Error('Filesystem not ready');
      if (!isE2EMode()) {
        await diskProjectService.saveTestCase(testCase);
      }
      setTestCases((prev) => {
        const idx = prev.findIndex((t) => t.id === testCase.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = testCase;
          return updated;
        }
        return [...prev, testCase];
      });
      if (!isE2EMode()) await refreshStatus();
    },
    [isReady, refreshStatus]
  );

  const deleteTestCase = useCallback(
    async (id: string) => {
      if (!isReady) throw new Error('Filesystem not ready');
      if (!isE2EMode()) {
        await diskProjectService.deleteTestCase(id);
      }
      setTestCases((prev) => prev.filter((t) => t.id !== id));
      if (!isE2EMode()) await refreshStatus();
    },
    [isReady, refreshStatus]
  );

  // CRUD operations - Information
  const saveInformation = useCallback(
    async (info: Information) => {
      if (!isReady) throw new Error('Filesystem not ready');
      if (!isE2EMode()) {
        await diskProjectService.saveInformation(info);
      }
      setInformation((prev) => {
        const idx = prev.findIndex((i) => i.id === info.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = info;
          return updated;
        }
        return [...prev, info];
      });
      if (!isE2EMode()) await refreshStatus();
    },
    [isReady, refreshStatus]
  );

  const deleteInformation = useCallback(
    async (id: string) => {
      if (!isReady) throw new Error('Filesystem not ready');
      if (!isE2EMode()) {
        await diskProjectService.deleteInformation(id);
      }
      setInformation((prev) => prev.filter((i) => i.id !== id));
      if (!isE2EMode()) await refreshStatus();
    },
    [isReady, refreshStatus]
  );

  // CRUD operations - Projects
  const saveProject = useCallback(
    async (project: Project) => {
      if (!isReady) throw new Error('Filesystem not ready');
      if (!isE2EMode()) {
        await diskProjectService.updateProject(project);
      }
      setProjects((prev) => {
        const idx = prev.findIndex((p) => p.id === project.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = project;
          return updated;
        }
        return [...prev, project];
      });
      if (!isE2EMode()) await refreshStatus();
    },
    [isReady, refreshStatus]
  );

  const createProject = useCallback(
    async (name: string, description: string): Promise<Project> => {
      if (!isReady) throw new Error('Filesystem not ready');

      let project: Project;
      if (isE2EMode()) {
        // In E2E mode, create project in memory
        project = {
          id: `project - ${Date.now()} `,
          name,
          description,
          requirementIds: [],
          useCaseIds: [],
          testCaseIds: [],
          informationIds: [],
          lastModified: Date.now(),
        };
      } else {
        project = await diskProjectService.createProject(name, description);
      }
      setProjects((prev) => [...prev, project]);
      setCurrentProjectIdState(project.id);
      if (!isE2EMode()) await refreshStatus();
      return project;
    },
    [isReady, refreshStatus]
  );

  const deleteProject = useCallback(
    async (id: string) => {
      if (!isReady) throw new Error('Filesystem not ready');
      if (!isE2EMode()) {
        await diskProjectService.deleteProject(id);
      }
      // Soft-delete: update isDeleted flag instead of removing from array
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isDeleted: true, lastModified: Date.now() } : p))
      );
      if (!isE2EMode()) await refreshStatus();
    },
    [isReady, refreshStatus]
  );

  const setCurrentProject = useCallback(
    async (projectId: string) => {
      if (!isReady) throw new Error('Filesystem not ready');
      if (!isE2EMode()) {
        await diskProjectService.setCurrentProjectId(projectId);
      }
      setCurrentProjectIdState(projectId);
    },
    [isReady]
  );

  // Get next ID
  const getNextId = useCallback(
    async (type: 'requirements' | 'useCases' | 'testCases' | 'information'): Promise<string> => {
      if (isE2EMode()) {
        // In E2E mode, use local counter
        const prefix = {
          requirements: 'REQ',
          useCases: 'UC',
          testCases: 'TC',
          information: 'INFO',
        }[type];
        const counterKey = {
          requirements: 'req',
          useCases: 'uc',
          testCases: 'tc',
          information: 'info',
        }[type] as keyof typeof e2eCounters;
        const nextNum = e2eCounters[counterKey] + 1;
        setE2eCounters((prev) => ({ ...prev, [counterKey]: nextNum }));
        return `${prefix} -${String(nextNum).padStart(3, '0')} `;
      }
      return await diskProjectService.getNextId(type);
    },
    [e2eCounters]
  );

  // Git operations
  const commitFile = useCallback(
    async (filepath: string, message: string, authorName?: string) => {
      if (!isReady) throw new Error('Filesystem not ready');
      if (isE2EMode()) return; // Skip git operations in E2E mode
      console.log(
        `[commitFile] Committing ${filepath} with message: ${message} by ${authorName || 'Tracyfy User'} `
      );
      await realGitService.commitFile(filepath, message, authorName);
      // Note: We intentionally don't call refreshStatus() here.
      // Calling it after every commit causes massive performance issues
      // when committing multiple files. The PendingChangesPanel handles
      // removing items from the UI optimistically.
      console.log(`[commitFile] Committed ${filepath} successfully`);
    },
    [isReady]
  );

  const getArtifactHistory = useCallback(
    async (type: 'requirements' | 'usecases' | 'testcases' | 'information', id: string) => {
      if (!isReady || isE2EMode()) return [];
      return await realGitService.getHistory(`${type}/${id}.md`);
    },
    [isReady]
  );

  const createBaseline = useCallback(
    async (name: string, message: string) => {
      if (!isReady) throw new Error('Filesystem not ready');
      if (isE2EMode()) return; // Skip git operations in E2E mode
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
        isApiSupported: fileSystemService.isSupported(),
        directoryName,
        error,
        selectDirectory,
        // Data
        projects,
        currentProjectId,
        requirements,
        useCases,
        testCases,
        information,
        // Git
        pendingChanges,
        refreshStatus,
        // CRUD
        saveRequirement,
        saveUseCase,
        saveTestCase,
        saveInformation,
        deleteRequirement,
        deleteUseCase,
        deleteTestCase,
        deleteInformation,
        saveProject,
        createProject,
        deleteProject,
        setCurrentProject,
        getNextId,
        reloadData,
        // Git operations
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
