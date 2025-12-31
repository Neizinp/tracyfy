import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { debug } from '../../utils/debug';
import { fileSystemService } from '../../services/fileSystemService';
import {
  realGitService,
  type FileStatus,
  type CommitInfo,
  type PullResult,
} from '../../services/realGitService';
import { diskProjectService } from '../../services/diskProjectService';
import {
  requirementService,
  useCaseService,
  testCaseService,
  informationService,
  projectService,
  riskService,
  documentService,
} from '../../services/artifactServices';
import { diskLinkService } from '../../services/diskLinkService';
import { useBackgroundTasks } from './BackgroundTasksProvider';
import type {
  Requirement,
  UseCase,
  TestCase,
  Information,
  Link,
  Project,
  Risk,
  ArtifactDocument,
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
  risks: Risk[];
  documents: ArtifactDocument[];
  links: Link[];
  // Preloaded user data for fast access
  preloadedUsers: import('../../types').User[];
  preloadedCurrentUserId: string;
  // Git-related
  pendingChanges: FileStatus[];
  refreshStatus: () => Promise<void>;
  // CRUD operations (save to disk)
  saveRequirement: (requirement: Requirement) => Promise<void>;
  saveUseCase: (useCase: UseCase) => Promise<void>;
  saveTestCase: (testCase: TestCase) => Promise<void>;
  saveInformation: (info: Information) => Promise<void>;
  saveRisk: (risk: Risk) => Promise<void>;
  saveDocument: (document: ArtifactDocument) => Promise<void>;
  deleteRequirement: (id: string) => Promise<void>;
  deleteUseCase: (id: string) => Promise<void>;
  deleteTestCase: (id: string) => Promise<void>;
  deleteInformation: (id: string) => Promise<void>;
  deleteRisk: (id: string) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  saveProject: (project: Project) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  saveLink: (link: Link) => Promise<void>;
  deleteLink: (id: string) => Promise<void>;
  createProject: (name: string, description: string) => Promise<Project>;
  setCurrentProject: (projectId: string) => Promise<void>;
  getNextId: (
    type:
      | 'requirements'
      | 'useCases'
      | 'testCases'
      | 'information'
      | 'risks'
      | 'links'
      | 'customAttributes'
      | 'workflows'
      | 'documents'
      | 'links'
  ) => Promise<string>;
  // Reload from disk
  reloadData: () => Promise<void>;
  // Git operations
  commitFile: (filepath: string, message: string, authorName?: string) => Promise<void>;
  revertFile: (filepath: string) => Promise<void>;
  getArtifactHistory: (
    type: 'requirements' | 'usecases' | 'testcases' | 'information' | 'risks' | 'documents',
    id: string
  ) => Promise<CommitInfo[]>;
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

export const FileSystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isReady, setIsReady] = useState(initialE2EMode);
  const [isLoading, setIsLoading] = useState(!initialE2EMode);

  const [directoryName, setDirectoryName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingChanges, setPendingChanges] = useState<FileStatus[]>([]);
  const [information, setInformation] = useState<Information[]>([]);
  const [risks, setRisks] = useState<Risk[]>([]);
  const [documents, setDocuments] = useState<ArtifactDocument[]>([]);
  const [links, setLinks] = useState<Link[]>([]);

  // All data from disk
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectIdState] = useState<string>('');
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [useCases, setUseCases] = useState<UseCase[]>([]);
  const [testCases, setTestCases] = useState<TestCase[]>([]);

  // Preloaded user data for fast access by UserProvider
  const [preloadedUsers, setPreloadedUsers] = useState<import('../../types').User[]>([]);
  const [preloadedCurrentUserId, setPreloadedCurrentUserId] = useState<string>('');

  // Counter for E2E mode to generate unique IDs
  const [e2eCounters, setE2eCounters] = useState({
    req: 0,
    uc: 0,
    tc: 0,
    info: 0,
    risk: 0,
    doc: 0,
    link: 0,
    attr: 0,
    wf: 0,
  });

  // Background tasks for status bar
  const { startTask, endTask } = useBackgroundTasks();

  // Debounce timer for refreshStatus to coalesce rapid calls
  const refreshStatusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const REFRESH_STATUS_DEBOUNCE_MS = 300;

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
          const status = await realGitService.getStatus();
          debug.log(`[refreshStatus] Received ${status.length} files`);
          setPendingChanges(status);
        } catch (err) {
          console.error('[refreshStatus] Error during getStatus:', err);
        } finally {
          endTask(taskId);
        }
      }
    }, REFRESH_STATUS_DEBOUNCE_MS);
  }, [startTask, endTask]);

  // Load all data from disk using diskProjectService
  const reloadData = useCallback(async () => {
    const taskId = startTask('Loading data...');
    try {
      debug.log('[reloadData] Loading all data from disk...');
      const data = await diskProjectService.loadAll();
      setProjects(data.projects);
      setCurrentProjectIdState(data.currentProjectId);
      setRequirements(data.requirements);
      setUseCases(data.useCases);
      setTestCases(data.testCases);
      setInformation(data.information);
      setDocuments(data.documents);
      setLinks(data.links);
      setRisks(data.risks);

      // Preload user data so UserProvider doesn't need a second disk read
      setPreloadedUsers(data.users);
      setPreloadedCurrentUserId(data.currentUserId);

      // Recalculate counters to make sure they're in sync
      await diskProjectService.recalculateCounters();
      debug.log('[reloadData] Data loaded:', {
        projects: data.projects.length,
        requirements: data.requirements.length,
        useCases: data.useCases.length,
        testCases: data.testCases.length,
        information: data.information.length,
        risks: data.risks.length,
        documents: data.documents.length,
        links: data.links.length,
        users: data.users.length,
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
        if (
          typeof window !== 'undefined' &&
          (window as unknown as ExtendedWindow).__E2E_TEST_MODE__
        ) {
          debug.log('[FileSystemProvider] E2E test mode enabled');
          setDirectoryName('E2E Test Directory');
          // Initialize with empty data for E2E tests
          setProjects([]);
          setCurrentProjectIdState('');
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
            // Initialize git with the restored directory (handle for browser, path for Electron)
            const gitInitialized = await realGitService.init(result.handle);
            if (gitInitialized) {
              setDirectoryName(fileSystemService.getDirectoryName());

              // Initialize disk project service directories
              await diskProjectService.initialize();

              // Load data and git status in parallel (they're independent)
              const [, status] = await Promise.all([reloadData(), realGitService.getStatus()]);
              setPendingChanges(status);

              setIsReady(true);
            }
          } finally {
            endTask(initTaskId);
          }
        }
      } catch (err) {
        console.error('Failed to restore directory:', err);
      }

      setIsLoading(false);
    };

    tryRestore();
  }, [reloadData, startTask, endTask]);

  const selectDirectory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const taskId = startTask('Loading project...');

    try {
      const result = await fileSystemService.selectDirectory();

      // Initialize git (handle for browser, path for Electron)
      const gitInitialized = await realGitService.init(result.handle);
      if (!gitInitialized) {
        setError('Git initialization was cancelled. A git repository is required.');
        setIsLoading(false);
        endTask(taskId);
        return;
      }

      setDirectoryName(fileSystemService.getDirectoryName());

      // Initialize disk project service directories
      await diskProjectService.initialize();

      // Load data and git status in parallel (they're independent)
      const [, status] = await Promise.all([reloadData(), realGitService.getStatus()]);
      debug.log('[selectDirectory] Setting pendingChanges to:', status);
      setPendingChanges(status);

      setIsReady(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      endTask(taskId);
      setIsLoading(false);
    }
  }, [reloadData, startTask, endTask]);

  // CRUD operations - Requirements
  const saveRequirement = useCallback(
    async (requirement: Requirement) => {
      if (!isReady) throw new Error('Filesystem not ready');
      if (!isE2EMode()) {
        await requirementService.save(requirement);
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
      if (!isE2EMode()) refreshStatus(); // Fire-and-forget for responsive UI
    },
    [isReady, refreshStatus]
  );

  const deleteRequirement = useCallback(
    async (id: string) => {
      if (!isReady) throw new Error('Filesystem not ready');
      if (!isE2EMode()) {
        await requirementService.delete(id);
      }
      setRequirements((prev) => prev.filter((r) => r.id !== id));
      if (!isE2EMode()) refreshStatus(); // Fire-and-forget for responsive UI
    },
    [isReady, refreshStatus]
  );

  // CRUD operations - Use Cases
  const saveUseCase = useCallback(
    async (useCase: UseCase) => {
      if (!isReady) throw new Error('Filesystem not ready');
      if (!isE2EMode()) {
        await useCaseService.save(useCase);
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
      if (!isE2EMode()) refreshStatus(); // Fire-and-forget for responsive UI
    },
    [isReady, refreshStatus]
  );

  const deleteUseCase = useCallback(
    async (id: string) => {
      if (!isReady) throw new Error('Filesystem not ready');
      if (!isE2EMode()) {
        await useCaseService.delete(id);
      }
      setUseCases((prev) => prev.filter((u) => u.id !== id));
      if (!isE2EMode()) refreshStatus(); // Fire-and-forget for responsive UI
    },
    [isReady, refreshStatus]
  );

  // CRUD operations - Test Cases
  const saveTestCase = useCallback(
    async (testCase: TestCase) => {
      if (!isReady) throw new Error('Filesystem not ready');
      if (!isE2EMode()) {
        await testCaseService.save(testCase);
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
      if (!isE2EMode()) refreshStatus(); // Fire-and-forget for responsive UI
    },
    [isReady, refreshStatus]
  );

  const deleteTestCase = useCallback(
    async (id: string) => {
      if (!isReady) throw new Error('Filesystem not ready');
      if (!isE2EMode()) {
        await testCaseService.delete(id);
      }
      setTestCases((prev) => prev.filter((t) => t.id !== id));
      if (!isE2EMode()) refreshStatus(); // Fire-and-forget for responsive UI
    },
    [isReady, refreshStatus]
  );

  // CRUD operations - Information
  const saveInformation = useCallback(
    async (info: Information) => {
      if (!isReady) throw new Error('Filesystem not ready');
      if (!isE2EMode()) {
        await informationService.save(info);
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
      if (!isE2EMode()) refreshStatus(); // Fire-and-forget for responsive UI
    },
    [isReady, refreshStatus]
  );

  const deleteInformation = useCallback(
    async (id: string) => {
      if (!isReady) throw new Error('Filesystem not ready');
      if (!isE2EMode()) {
        await informationService.delete(id);
      }
      setInformation((prev) => prev.filter((i) => i.id !== id));
      if (!isE2EMode()) refreshStatus(); // Fire-and-forget for responsive UI
    },
    [isReady, refreshStatus]
  );

  // CRUD operations - Risks
  const saveRisk = useCallback(
    async (risk: Risk) => {
      if (!isReady) throw new Error('Filesystem not ready');
      if (!isE2EMode()) {
        await riskService.save(risk);
      }
      setRisks((prev) => {
        const idx = prev.findIndex((r) => r.id === risk.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = risk;
          return updated;
        }
        return [...prev, risk];
      });
      if (!isE2EMode()) refreshStatus(); // Fire-and-forget for responsive UI
    },
    [isReady, refreshStatus]
  );

  const deleteRisk = useCallback(
    async (id: string) => {
      if (!isReady) throw new Error('Filesystem not ready');
      if (!isE2EMode()) {
        await riskService.delete(id);
      }
      setRisks((prev) => prev.filter((r) => r.id !== id));
      if (!isE2EMode()) refreshStatus(); // Fire-and-forget for responsive UI
    },
    [isReady, refreshStatus]
  );

  // CRUD operations - Documents
  const saveDocument = useCallback(
    async (document: ArtifactDocument) => {
      if (!isReady) throw new Error('Filesystem not ready');
      if (!isE2EMode()) {
        await documentService.save(document);
      }
      setDocuments((prev) => {
        const idx = prev.findIndex((d) => d.id === document.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = document;
          return updated;
        }
        return [...prev, document];
      });
      if (!isE2EMode()) refreshStatus(); // Fire-and-forget for responsive UI
    },
    [isReady, refreshStatus]
  );

  const deleteDocument = useCallback(
    async (id: string) => {
      if (!isReady) throw new Error('Filesystem not ready');
      if (!isE2EMode()) {
        await documentService.delete(id);
      }
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      if (!isE2EMode()) refreshStatus(); // Fire-and-forget for responsive UI
    },
    [isReady, refreshStatus]
  );

  // CRUD operations - Projects
  const saveProject = useCallback(
    async (project: Project) => {
      if (!isReady) throw new Error('Filesystem not ready');
      if (!isE2EMode()) {
        await projectService.save(project);
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
      if (!isE2EMode()) refreshStatus(); // Fire-and-forget for responsive UI
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
          id: `project-${Date.now()}`,
          name,
          description,
          requirementIds: [],
          useCaseIds: [],
          testCaseIds: [],
          informationIds: [],
          riskIds: [],
          lastModified: Date.now(),
        };
      } else {
        project = await diskProjectService.createProject(name, description);
      }
      setProjects((prev) => [...prev, project]);
      setCurrentProjectIdState(project.id);
      if (!isE2EMode()) refreshStatus(); // Fire-and-forget for responsive UI
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
      if (!isE2EMode()) refreshStatus(); // Fire-and-forget for responsive UI
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

  // CRUD operations - Links
  const saveLink = useCallback(
    async (link: Link) => {
      if (!isReady) throw new Error('Filesystem not ready');
      if (!isE2EMode()) {
        await diskLinkService.save(link);
      }
      setLinks((prev) => {
        const idx = prev.findIndex((l) => l.id === link.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = link;
          return updated;
        }
        return [...prev, link];
      });
      if (!isE2EMode()) refreshStatus(); // Fire-and-forget for responsive UI
    },
    [isReady, refreshStatus]
  );

  const deleteLink = useCallback(
    async (id: string) => {
      if (!isReady) throw new Error('Filesystem not ready');
      if (!isE2EMode()) {
        await diskLinkService.delete(id);
      }
      setLinks((prev) => prev.filter((l) => l.id !== id));
      if (!isE2EMode()) refreshStatus(); // Fire-and-forget for responsive UI
    },
    [isReady, refreshStatus]
  );

  // Get next ID
  const getNextId = useCallback(
    async (
      type:
        | 'requirements'
        | 'useCases'
        | 'testCases'
        | 'information'
        | 'risks'
        | 'links'
        | 'customAttributes'
        | 'workflows'
        | 'documents'
    ): Promise<string> => {
      if (isE2EMode()) {
        // In E2E mode, use local counter
        const prefix = {
          requirements: 'REQ',
          useCases: 'UC',
          testCases: 'TC',
          information: 'INFO',
          risks: 'RISK',
          links: 'LINK',
          customAttributes: 'ATTR',
          workflows: 'WF',
          documents: 'DOC',
        }[type];
        const counterKey = {
          requirements: 'req',
          useCases: 'uc',
          testCases: 'tc',
          information: 'info',
          risks: 'risk',
          links: 'link',
          customAttributes: 'attr',
          workflows: 'wf',
          documents: 'doc',
        }[type] as keyof typeof e2eCounters;
        const nextNum = e2eCounters[counterKey] + 1;
        setE2eCounters((prev) => ({ ...prev, [counterKey]: nextNum }));
        return `${prefix}-${String(nextNum).padStart(3, '0')}`;
      }
      return await diskProjectService.getNextIdWithSync(type);
    },
    [e2eCounters]
  );

  // Git operations
  const commitFile = useCallback(
    async (filepath: string, message: string, authorName?: string) => {
      if (!isReady) throw new Error('Filesystem not ready');
      if (isE2EMode()) return; // Skip git operations in E2E mode
      debug.log(
        `[commitFile] Committing ${filepath} with message: ${message} by ${authorName || 'Tracyfy User'}`
      );
      await realGitService.commitFile(filepath, message, authorName);
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
        debug.log('[revertFile] Calling realGitService.revertFile...');
        await realGitService.revertFile(filepath);
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
    async (
      type: 'requirements' | 'usecases' | 'testcases' | 'information' | 'risks' | 'documents',
      id: string
    ) => {
      if (!isReady || isE2EMode()) return [];
      const folder = type === 'documents' ? 'documents' : type;
      return await realGitService.getHistory(`${folder}/${id}.md`);
    },
    [isReady]
  );

  const readFileAtCommit = useCallback(async (path: string, hash: string) => {
    if (isE2EMode()) return null;
    return await realGitService.readFileAtCommit(path, hash);
  }, []);

  const push = useCallback(async () => {
    return await realGitService.push();
  }, []);

  const pull = useCallback(async () => {
    return await realGitService.pull();
  }, []);

  const hasRemote = useCallback(async () => {
    return await realGitService.hasRemote();
  }, []);

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
        risks,
        documents,
        links,
        preloadedUsers,
        preloadedCurrentUserId,
        // Git
        pendingChanges,
        refreshStatus,
        // CRUD
        saveRequirement,
        saveUseCase,
        saveTestCase,
        saveInformation,
        saveRisk,
        saveDocument,
        deleteRequirement,
        deleteUseCase,
        deleteTestCase,
        deleteInformation,
        deleteRisk,
        deleteDocument,
        saveProject,
        createProject,
        deleteProject,
        saveLink,
        deleteLink,
        setCurrentProject,
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
