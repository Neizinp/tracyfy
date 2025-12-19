/**
 * Real Git Service - Uses isomorphic-git with File System Access API or Electron IPC
 *
 * In Electron, routes git operations through IPC to the main process (which uses Node fs).
 * In browsers, uses an adapter over the File System Access API.
 */

import { debug } from '../utils/debug';
import git from 'isomorphic-git';
import { fileSystemService } from './fileSystemService';
import { fsAdapter } from './fsAdapter';
import type { Requirement, UseCase, TestCase, Information, CommitInfo, SyncStatus } from '../types';

export type { CommitInfo, SyncStatus };
import {
  requirementToMarkdown,
  markdownToRequirement,
  convertUseCaseToMarkdown,
  markdownToUseCase,
  testCaseToMarkdown,
  markdownToTestCase,
  informationToMarkdown,
  markdownToInformation,
} from '../utils/markdownUtils';

// Type for electron API
declare global {
  interface Window {
    electronAPI?: {
      isElectron: boolean;
      git: {
        status: (dir: string, filepath: string) => Promise<string>;
        statusMatrix: (dir: string) => Promise<[string, number, number, number][]>;
        add: (dir: string, filepath: string) => Promise<{ ok?: boolean; error?: string }>;
        remove: (dir: string, filepath: string) => Promise<{ ok?: boolean; error?: string }>;
        commit: (
          dir: string,
          message: string,
          author?: { name: string; email: string }
        ) => Promise<{ oid?: string; error?: string }>;
        log: (
          dir: string,
          depth?: number,
          filepath?: string,
          ref?: string
        ) => Promise<CommitInfo[]>;
        listFiles: (dir: string, ref?: string) => Promise<string[]>;
        readBlob: (
          dir: string,
          oid: string,
          filepath: string
        ) => Promise<{ blob?: number[]; error?: string }>;
        resolveRef: (dir: string, ref: string) => Promise<string>;
        isDescendent: (
          dir: string,
          oid: string,
          ancestor: string,
          depth?: number
        ) => Promise<boolean | { error: string }>;
        currentBranch: (dir: string) => Promise<string | null>;
        init: (dir: string) => Promise<{ ok?: boolean; error?: string }>;
        annotatedTag: (
          dir: string,
          ref: string,
          message: string,
          tagger?: { name: string; email: string }
        ) => Promise<{ ok?: boolean; error?: string }>;
        listTags: (dir: string) => Promise<string[]>;
        readTag: (
          dir: string,
          oid: string
        ) => Promise<{ message: string; timestamp: number; object: string }>;
        // Remote operations
        addRemote: (
          dir: string,
          name: string,
          url: string
        ) => Promise<{ ok?: boolean; error?: string }>;
        removeRemote: (dir: string, name: string) => Promise<{ ok?: boolean; error?: string }>;
        listRemotes: (dir: string) => Promise<{ name: string; url: string }[] | { error: string }>;
        fetch: (
          dir: string,
          remote: string,
          branch?: string,
          token?: string
        ) => Promise<{ ok?: boolean; error?: string }>;
        push: (
          dir: string,
          remote: string,
          branch: string,
          token?: string
        ) => Promise<{ ok?: boolean; error?: string }>;
        pull: (
          dir: string,
          remote: string,
          branch: string,
          token?: string,
          author?: { name: string; email: string }
        ) => Promise<{ ok?: boolean; conflicts?: string[]; error?: string }>;
      };
      secure: {
        setToken: (token: string) => Promise<{ ok?: boolean; error?: string }>;
        getToken: () => Promise<{ token?: string | null; error?: string }>;
        removeToken: () => Promise<{ ok?: boolean; error?: string }>;
      };
    };
  }
}

const isElectronEnv = () => typeof window !== 'undefined' && !!window.electronAPI?.isElectron;

export interface FileStatus {
  path: string;
  status: string;
}

/**
 * Parse status matrix into FileStatus array
 */
function parseStatusMatrix(matrix: [string, number, number, number][]): {
  statuses: FileStatus[];
  allFiles: Set<string>;
} {
  const allFiles = new Set<string>();
  const statuses = matrix
    .map(([filepath, head, workdir, stage]) => {
      allFiles.add(filepath);

      let status = 'unchanged';
      // [HEAD, WORKDIR, STAGE]
      // [0, 2, 0] = new file, not staged
      // [0, 2, 2] = new file, staged
      // [1, 2, 1] = modified, not staged
      // [1, 2, 2] = modified, staged
      // [1, 0, 0] = deleted, not staged
      // [1, 1, 1] = unchanged (committed)
      // [1, 2, 3] = modified in workdir (stage has old version)
      if (head === 1 && workdir === 1 && stage === 1) {
        status = 'unchanged';
      } else if (head === 1 && workdir === 2) {
        status = 'modified';
      } else if (head === 0 && workdir === 2 && stage === 0) {
        status = 'new';
      } else if (head === 0 && workdir === 2 && stage === 2) {
        status = 'added';
      } else if (head === 1 && workdir === 0) {
        status = 'deleted';
      }

      return { path: filepath, status };
    })
    .filter((f) => f.status !== 'unchanged');

  return { statuses, allFiles };
}

class RealGitService {
  private initialized = false;
  private rootDir = '.';
  // Commit queue to serialize git commits (prevents race conditions)
  private commitQueue: Promise<void> = Promise.resolve();
  // Cache for getCommitFiles results (commit hash -> files)
  private commitFilesCache = new Map<string, string[]>();
  // Path to cache file in project folder
  private readonly CACHE_FILE = '.tracyfy/commit-cache.json';
  // Flag to track if cache has been loaded from disk
  private cacheLoadedFromDisk = false;
  // Memory cache for PAT token
  private authToken: string | null = null;
  private tokenLoaded = false;

  /**
   * Get the root directory path (Electron uses absolute path, browser uses '.')
   */
  private getRootDir(): string {
    if (isElectronEnv()) {
      const rootPath = fileSystemService.getRootPath();
      return rootPath || '.';
    }
    return this.rootDir;
  }

  /**
   * Load commit files cache from disk
   */
  private async loadCacheFromDisk(): Promise<void> {
    if (this.cacheLoadedFromDisk) return;

    try {
      const content = await fileSystemService.readFile(this.CACHE_FILE);
      if (!content) return; // No cache file exists yet
      const data = JSON.parse(content) as Record<string, string[]>;
      for (const [hash, files] of Object.entries(data)) {
        this.commitFilesCache.set(hash, files);
      }
      debug.log(
        `[RealGitService] Loaded ${Object.keys(data).length} cached commit files from disk`
      );
    } catch {
      // Cache file doesn't exist yet - that's fine
    }
    this.cacheLoadedFromDisk = true;
  }

  /**
   * Save commit files cache to disk
   */
  private async saveCacheToDisk(): Promise<void> {
    try {
      const data: Record<string, string[]> = {};
      for (const [hash, files] of this.commitFilesCache.entries()) {
        data[hash] = files;
      }
      await fileSystemService.writeFile(this.CACHE_FILE, JSON.stringify(data, null, 2));
    } catch (err) {
      console.warn('[RealGitService] Failed to save commit cache to disk:', err);
    }
  }

  /**
   * Initialize git with the selected directory
   */
  async init(directoryHandle?: FileSystemDirectoryHandle): Promise<boolean> {
    console.log('[realGitService.init] Starting, isElectron:', isElectronEnv());

    // Browser path: set FSA handle
    if (!isElectronEnv() && directoryHandle) {
      fsAdapter.setRoot(directoryHandle);
    }

    // For Electron, verify we have a root path
    if (isElectronEnv()) {
      const rootPath = fileSystemService.getRootPath();
      console.log('[realGitService.init] Electron rootPath:', rootPath);
      if (!rootPath) {
        console.error('[realGitService.init] No root path set in Electron mode!');
        return false;
      }
    }

    // Check if .git exists
    const hasGit = await fileSystemService.checkGitExists();
    console.log('[realGitService.init] hasGit:', hasGit);

    // Check if HEAD exists (valid repo)
    let hasValidRepo = false;
    if (hasGit) {
      try {
        const headContent = await fileSystemService.readFile('.git/HEAD');
        hasValidRepo = !!headContent;
      } catch {
        hasValidRepo = false;
      }
    }
    console.log('[realGitService.init] hasValidRepo:', hasValidRepo);

    if (!hasGit || !hasValidRepo) {
      if (hasGit && !hasValidRepo) {
        console.warn('[init] Incomplete git repository detected - will reinitialize');

        // Recreate HEAD pointing to main so git operations can proceed
        try {
          await fileSystemService.writeFile('.git/HEAD', 'ref: refs/heads/main\n');
          await fileSystemService.writeFile('.git/refs/heads/main', '');
        } catch (err) {
          console.error('[init] Failed to recreate HEAD', err);
        }
      }

      // In Electron, use IPC to initialize git - auto-init without prompting
      if (isElectronEnv()) {
        debug.log('[init] Auto-initializing git repository...');

        const rootDir = this.getRootDir();
        console.log('[realGitService.init] Calling git.init with rootDir:', rootDir);
        const result = await window.electronAPI!.git.init(rootDir);
        if (result.error) {
          console.error('[init] Git init failed:', result.error);
          return false;
        }

        this.initialized = true;
        await this.ensureTokenLoaded(); // Added this line
        console.log('[realGitService.init] Success! initialized =', this.initialized);
        return true;
      }

      // Browser path: auto-initialize git without prompting
      debug.log('[init] Auto-initializing git repository (browser)...');

      // Initialize git repository
      await git.init({
        fs: fsAdapter,
        dir: '.',
        defaultBranch: 'main',
      });

      // Create HEAD pointing to main branch
      try {
        await fsAdapter.promises.writeFile('.git/HEAD', 'ref: refs/heads/main\n');
      } catch (err) {
        console.error('[init] Failed to create HEAD:', err);
      }
    }

    this.initialized = true;

    // Ensure essential git files exist
    const essentialFiles = [
      { path: '.git/info/exclude', content: '# Exclude patterns\n' },
      {
        path: '.git/description',
        content: 'Unnamed repository; edit this file to name the repository.\n',
      },
    ];

    for (const file of essentialFiles) {
      try {
        await fsAdapter.promises.readFile(file.path, { encoding: 'utf8' });
      } catch {
        await fsAdapter.promises.writeFile(file.path, file.content);
      }
    }

    await this.ensureTokenLoaded();
    return true;
  }

  /**
   * Save an artifact to disk (no commit)
   */
  async saveArtifact(
    type: 'requirements' | 'usecases' | 'testcases' | 'information',
    id: string,
    artifact: Requirement | UseCase | TestCase | Information
  ): Promise<void> {
    if (!this.initialized) {
      throw new Error('Git service not initialized');
    }

    // Convert artifact to markdown
    let markdown: string;
    switch (type) {
      case 'requirements':
        markdown = requirementToMarkdown(artifact as Requirement);
        break;
      case 'usecases':
        markdown = convertUseCaseToMarkdown(artifact as UseCase);
        break;
      case 'testcases':
        markdown = testCaseToMarkdown(artifact as TestCase);
        break;
      case 'information':
        markdown = informationToMarkdown(artifact as Information);
        break;
    }

    const filePath = `${type}/${id}.md`;
    await fileSystemService.writeFile(filePath, markdown);
  }

  /**
   * Delete an artifact from disk (no commit)
   */
  async deleteArtifact(
    type: 'requirements' | 'usecases' | 'testcases' | 'information',
    id: string
  ): Promise<void> {
    if (!this.initialized) {
      throw new Error('Git service not initialized');
    }

    const filePath = `${type}/${id}.md`;

    try {
      await fileSystemService.deleteFile(filePath);
    } catch (error) {
      console.error('Failed to delete artifact:', error);
    }
  }

  /**
   * Rename a file with proper git tracking and auto-commit
   * This performs a git mv equivalent and immediately commits the rename,
   * so it appears as a single commit in history instead of two pending changes.
   *
   * @param oldPath - The current file path (relative to repo root)
   * @param newPath - The new file path (relative to repo root)
   * @param newContent - The new file content to write
   * @param commitMessage - Optional custom commit message (defaults to "Renamed: oldName → newName")
   */
  async renameFile(
    oldPath: string,
    newPath: string,
    newContent: string,
    commitMessage?: string
  ): Promise<void> {
    if (!this.initialized) {
      throw new Error('Git service not initialized');
    }

    const cache = {};

    // 1. Write the new file with updated content
    await fileSystemService.writeFile(newPath, newContent);

    // 2. Delete the old file
    await fileSystemService.deleteFile(oldPath);

    const oldName = oldPath.split('/').pop()?.replace('.md', '') || oldPath;
    const newName = newPath.split('/').pop()?.replace('.md', '') || newPath;
    const message = commitMessage || `Renamed project: ${oldName} → ${newName}`;

    if (isElectronEnv()) {
      // Use IPC for atomic git operations in Electron
      const resultRm = await window.electronAPI!.git.remove(this.getRootDir(), oldPath);
      if (resultRm.error) throw new Error(resultRm.error);

      const resultAdd = await window.electronAPI!.git.add(this.getRootDir(), newPath);
      if (resultAdd.error) throw new Error(resultAdd.error);

      const resultCommit = await window.electronAPI!.git.commit(this.getRootDir(), message);
      if (resultCommit.error) throw new Error(resultCommit.error);
      return;
    }

    // Browser path
    await git.remove({ fs: fsAdapter, dir: this.getRootDir(), filepath: oldPath, cache });
    await git.add({ fs: fsAdapter, dir: this.getRootDir(), filepath: newPath, cache });

    const author = { name: 'Tracyfy User', email: 'user@tracyfy.local' };
    await git.commit({
      fs: fsAdapter,
      dir: this.getRootDir(),
      message,
      author,
      cache,
    });

    debug.log(`[renameFile] Committed rename: ${oldPath} -> ${newPath}`);
  }

  /**
   * Get git status
   */
  async getStatus(): Promise<FileStatus[]> {
    if (!this.initialized) return [];

    try {
      let result: FileStatus[] = [];
      let statusMatrixFiles = new Set<string>();

      // Electron path: use IPC for proper git status
      if (isElectronEnv()) {
        const status = await window.electronAPI!.git.statusMatrix(this.getRootDir());
        if (Array.isArray(status)) {
          const parsed = parseStatusMatrix(status);
          result = parsed.statuses;
          statusMatrixFiles = parsed.allFiles;
        }
      } else {
        // Browser path: Use git.statusMatrix directly with fsAdapter
        try {
          const status = await git.statusMatrix({ fs: fsAdapter, dir: this.getRootDir() });
          if (Array.isArray(status)) {
            const parsed = parseStatusMatrix(status as [string, number, number, number][]);
            result = parsed.statuses;
            statusMatrixFiles = parsed.allFiles;
          }
        } catch (statusError) {
          console.error('[getStatus] statusMatrix failed:', statusError);
        }
      }

      // Enumerate artifact files to find untracked files
      const trackedPaths =
        statusMatrixFiles.size > 0 ? statusMatrixFiles : new Set(result.map((f) => f.path));
      const untrackedFiles: FileStatus[] = [];

      const artifactTypes = [
        'requirements',
        'usecases',
        'testcases',
        'information',
        'risks',
        'projects',
        'assets',
      ];
      const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp', '.tiff'];
      for (const type of artifactTypes) {
        try {
          const files = await fileSystemService.listFiles(type);
          if (type === 'assets') {
            debug.log(`[getStatus] Assets folder contains: ${files.length} files`, files);
          }
          for (const file of files) {
            const isMarkdown = file.endsWith('.md');
            const isImage =
              type === 'assets' && imageExtensions.some((ext) => file.toLowerCase().endsWith(ext));
            if (isMarkdown || isImage) {
              const filePath = `${type}/${file}`;
              if (!trackedPaths.has(filePath)) {
                debug.log(`[getStatus] Found untracked file: ${filePath}`);
                untrackedFiles.push({ path: filePath, status: 'new' });
              }
            }
          }
        } catch (err) {
          // Directory might not exist yet
          if (type === 'assets') {
            debug.log(`[getStatus] Assets folder does not exist or error:`, err);
          }
        }
      }

      return [...result, ...untrackedFiles];
    } catch (error) {
      console.error('Failed to get status:', error);
      return [];
    }
  }

  /**
   * Commit a single file (Atomic Commit)
   * @param authorName - Optional author name, defaults to 'Tracyfy User'
   */
  async commitFile(filepath: string, message: string, authorName?: string): Promise<void> {
    if (!this.initialized) {
      throw new Error('Git service not initialized');
    }

    // Queue the commit to ensure serialized execution
    // This prevents race conditions when multiple commits run concurrently
    this.commitQueue = this.commitQueue.then(async () => {
      const fileExists = (await fileSystemService.readFileBinary(filepath)) !== null;
      const authorNameToUse = authorName || 'Tracyfy User';
      const author = { name: authorNameToUse, email: 'user@tracyfy.local' };

      let commitOid: string;

      if (isElectronEnv()) {
        const rootDir = this.getRootDir();
        if (fileExists) {
          const res = await window.electronAPI!.git.add(rootDir, filepath);
          if (res.error) throw new Error(res.error);
        } else {
          const res = await window.electronAPI!.git.remove(rootDir, filepath);
          if (res.error) throw new Error(res.error);
        }

        const res = await window.electronAPI!.git.commit(rootDir, message, author);
        if (res.error) throw new Error(res.error);
        commitOid = res.oid!;
      } else {
        const cache = {};
        if (fileExists) {
          await git.add({ fs: fsAdapter, dir: this.getRootDir(), filepath, cache });
        } else {
          await git.remove({ fs: fsAdapter, dir: this.getRootDir(), filepath, cache });
        }

        commitOid = await git.commit({
          fs: fsAdapter,
          dir: this.getRootDir(),
          message,
          author,
          cache,
        });
      }

      debug.log(
        `[commitFile] Successfully committed ${filepath} by ${authorNameToUse}, SHA: ${commitOid}`
      );

      // Proactively cache the file for this commit (so Version History is instant)
      this.commitFilesCache.set(commitOid, [filepath]);
      void this.saveCacheToDisk();
    });

    // Wait for our commit to complete
    await this.commitQueue;
  }

  /**
   * Load all artifacts from disk
   */
  async loadAllArtifacts(): Promise<{
    requirements: Requirement[];
    useCases: UseCase[];
    testCases: TestCase[];
    information: Information[];
  }> {
    const requirements: Requirement[] = [];
    const useCases: UseCase[] = [];
    const testCases: TestCase[] = [];
    const information: Information[] = [];

    // Load requirements
    const reqFiles = await fileSystemService.listFiles('requirements');
    for (const file of reqFiles) {
      if (file.endsWith('.md')) {
        const content = await fileSystemService.readFile(`requirements/${file}`);
        if (content) {
          const req = markdownToRequirement(content);
          if (req) requirements.push(req);
        }
      }
    }

    // Load use cases
    const ucFiles = await fileSystemService.listFiles('usecases');
    for (const file of ucFiles) {
      if (file.endsWith('.md')) {
        const content = await fileSystemService.readFile(`usecases/${file}`);
        if (content) {
          const uc = markdownToUseCase(content);
          if (uc) useCases.push(uc);
        }
      }
    }

    // Load test cases
    const tcFiles = await fileSystemService.listFiles('testcases');
    for (const file of tcFiles) {
      if (file.endsWith('.md')) {
        const content = await fileSystemService.readFile(`testcases/${file}`);
        if (content) {
          const tc = markdownToTestCase(content);
          if (tc) testCases.push(tc);
        }
      }
    }

    // Load information
    const infoFiles = await fileSystemService.listFiles('information');
    for (const file of infoFiles) {
      if (file.endsWith('.md')) {
        const content = await fileSystemService.readFile(`information/${file}`);
        if (content) {
          const info = markdownToInformation(content);
          if (info) information.push(info);
        }
      }
    }

    return { requirements, useCases, testCases, information };
  }

  /**
   * List files at a specific commit
   */
  async listFilesAtCommit(commitHash: string): Promise<string[]> {
    if (!this.initialized) {
      return [];
    }

    try {
      if (isElectronEnv()) {
        // Electron IPC doesn't support listFiles with ref yet, falling back to HEAD for now
        // TODO: Update Electron IPC to support ref
        console.warn('[listFilesAtCommit] Electron IPC does not support ref yet');
        return await window.electronAPI!.git.listFiles(this.getRootDir());
      } else {
        return await git.listFiles({
          fs: fsAdapter,
          dir: this.getRootDir(),
          ref: commitHash,
        });
      }
    } catch (error) {
      console.error('[listFilesAtCommit] Failed to list files:', error);
      return [];
    }
  }

  /**
   * Load full project snapshot at a specific commit
   */
  async loadProjectSnapshot(commitHash: string): Promise<{
    requirements: Requirement[];
    useCases: UseCase[];
    testCases: TestCase[];
    information: Information[];
  }> {
    const requirements: Requirement[] = [];
    const useCases: UseCase[] = [];
    const testCases: TestCase[] = [];
    const information: Information[] = [];

    try {
      const allFiles = await this.listFilesAtCommit(commitHash);

      // Helper to load and parse files
      const loadFiles = async <T>(
        prefix: string,
        parser: (md: string) => T | null,
        targetArray: T[]
      ) => {
        const files = allFiles.filter((f) => f.startsWith(prefix) && f.endsWith('.md'));
        for (const file of files) {
          const content = await this.readFileAtCommit(file, commitHash);
          if (content) {
            const parsed = parser(content);
            if (parsed) targetArray.push(parsed);
          }
        }
      };

      await Promise.all([
        loadFiles('requirements/', markdownToRequirement, requirements),
        loadFiles('usecases/', markdownToUseCase, useCases),
        loadFiles('testcases/', markdownToTestCase, testCases),
        loadFiles('information/', markdownToInformation, information),
      ]);
    } catch (error) {
      console.error('[loadProjectSnapshot] Failed to load snapshot:', error);
    }

    return { requirements, useCases, testCases, information };
  }

  /**
   * Get git log for a specific file or all files
   */
  async getHistory(
    filepath?: string,
    depth: number = 100,
    ref: string = 'HEAD'
  ): Promise<CommitInfo[]> {
    if (!this.initialized) {
      return [];
    }

    try {
      let commits: CommitInfo[];

      // Electron path: use IPC
      if (isElectronEnv()) {
        commits = await window.electronAPI!.git.log(this.getRootDir(), depth, filepath, ref);
      } else {
        // Browser path: use fsAdapter
        const logs = await git.log({
          fs: fsAdapter,
          dir: this.getRootDir(),
          depth: depth,
          ref: ref,
          filepath: filepath || undefined,
        });
        commits = logs.map((log) => ({
          hash: log.oid,
          message: log.commit.message,
          author: log.commit.author.name,
          timestamp: log.commit.author.timestamp * 1000,
          parent: log.commit.parent,
        }));
      }

      return Array.isArray(commits) ? commits : [];
    } catch (error) {
      console.error('[getHistory] Failed to get git history:', error);
      return [];
    }
  }

  /**
   * Get files changed in a specific commit
   * Returns array of filepaths that were added, modified, or deleted
   * Results are cached since commit contents are immutable
   */
  async getCommitFiles(commitHash: string): Promise<string[]> {
    if (!this.initialized) {
      return [];
    }

    // Load cache from disk on first call
    await this.loadCacheFromDisk();

    // Check cache first - commit contents are immutable so cache is always valid
    const cached = this.commitFilesCache.get(commitHash);
    if (cached !== undefined) {
      return cached;
    }

    try {
      let parentHash: string | undefined;
      let currentFiles: string[];
      let parentFiles: string[] = [];

      if (isElectronEnv()) {
        const rootDir = this.getRootDir();
        // Get the commit to find its parent
        const commitLogs = await window.electronAPI!.git.log(rootDir, 1, undefined, commitHash);
        const commitLog = commitLogs[0];
        if (!commitLog) return [];

        parentHash = commitLog.parent?.[0];

        // Get files in this commit's tree
        currentFiles = await window.electronAPI!.git.listFiles(rootDir, commitHash);

        if (parentHash) {
          // Get files in parent's tree
          parentFiles = await window.electronAPI!.git.listFiles(rootDir, parentHash);
        }
      } else {
        // Browser path
        // Get the commit to find its parent
        const logs = await git.log({
          fs: fsAdapter,
          dir: this.getRootDir(),
          ref: commitHash,
          depth: 1,
        });

        const commitLog = logs[0];
        if (!commitLog) return [];

        parentHash = commitLog.commit.parent[0];

        // Get files in this commit's tree
        currentFiles = await git.listFiles({
          fs: fsAdapter,
          dir: this.getRootDir(),
          ref: commitHash,
        });

        if (parentHash) {
          // Get files in parent's tree
          parentFiles = await git.listFiles({
            fs: fsAdapter,
            dir: this.getRootDir(),
            ref: parentHash,
          });
        }
      }

      if (!parentHash) {
        // Initial commit - all files are new
        this.commitFilesCache.set(commitHash, currentFiles);
        void this.saveCacheToDisk();
        return currentFiles;
      }

      // Diff the file lists to find changed files
      const parentSet = new Set(parentFiles);
      const addedFiles = currentFiles.filter((f) => !parentSet.has(f));

      const currentSet = new Set(currentFiles);
      const deletedFiles = parentFiles.filter((f) => !currentSet.has(f));

      // For modifications, we would need to compare OIDs of all files in both lists.
      // To keep it simple and performant for now, we'll return added + deleted.
      // The requirement for "Version History Filtering" usually cares about what files were touched.
      // If we really need modified files, we'd need a more complex tree diff or use window.electronAPI!.git.treeDiff.
      const result = Array.from(new Set([...addedFiles, ...deletedFiles]));

      // Cache the result before returning
      this.commitFilesCache.set(commitHash, result);
      void this.saveCacheToDisk();
      return result;
    } catch (error) {
      console.error('[getCommitFiles] Failed:', error);
      return [];
    }
  }

  /**
   * Read file content at a specific commit
   */
  async readFileAtCommit(filepath: string, commitHash: string): Promise<string | null> {
    if (!this.initialized) {
      throw new Error('Git service not initialized');
    }

    try {
      if (isElectronEnv()) {
        const result = await window.electronAPI!.git.readBlob(
          this.getRootDir(),
          commitHash,
          filepath
        );
        if (result.error) {
          if (result.error.includes('NotFoundError')) return null;
          throw new Error(result.error);
        }
        if (!result.blob) return null;
        return new TextDecoder().decode(new Uint8Array(result.blob));
      } else {
        const result = await git.readBlob({
          fs: fsAdapter,
          dir: this.getRootDir(),
          oid: commitHash,
          filepath,
        });

        const blob = result?.blob;
        if (!blob) {
          return null;
        }

        return new TextDecoder().decode(blob);
      }
    } catch (error: unknown) {
      const err = error as { code?: string };
      if (err?.code === 'NotFoundError') {
        return null;
      }
      console.error(
        '[readFileAtCommit] Unexpected error reading',
        filepath,
        'at',
        commitHash,
        error
      );
      return null;
    }
  }

  /**
   * Create a git tag (baseline)
   */
  async createTag(tagName: string, message: string): Promise<void> {
    if (!this.initialized) {
      throw new Error('Git service not initialized');
    }

    const author = { name: 'Tracyfy User', email: 'user@tracyfy.local' };

    if (isElectronEnv()) {
      const result = await window.electronAPI!.git.annotatedTag(
        this.getRootDir(),
        tagName,
        message,
        author
      );
      if (result.error) throw new Error(result.error);
    } else {
      await git.annotatedTag({
        fs: fsAdapter,
        dir: this.getRootDir(),
        ref: tagName,
        message,
        tagger: author,
      });
    }
  }

  /**
   * List all tags
   */
  async listTags(): Promise<string[]> {
    if (!this.initialized) {
      return [];
    }

    try {
      if (isElectronEnv()) {
        return await window.electronAPI!.git.listTags(this.getRootDir());
      } else {
        return await git.listTags({ fs: fsAdapter, dir: this.getRootDir() });
      }
    } catch {
      return [];
    }
  }

  /**
   * Get all tags with their details (for baselines)
   */
  async getTagsWithDetails(): Promise<
    Array<{ name: string; message: string; timestamp: number; commit: string }>
  > {
    if (!this.initialized) return [];

    try {
      const tagNames = isElectronEnv()
        ? await window.electronAPI!.git.listTags(this.getRootDir())
        : await git.listTags({ fs: fsAdapter, dir: this.getRootDir() });
      const tags = [];

      for (const name of tagNames) {
        try {
          if (isElectronEnv()) {
            const oid = await window.electronAPI!.git.resolveRef(this.getRootDir(), name);
            const read = await window.electronAPI!.git.readTag(this.getRootDir(), oid);
            tags.push({
              name,
              message: read.message,
              timestamp: read.timestamp * 1000,
              commit: read.object,
            });
          } else {
            const oid = await git.resolveRef({ fs: fsAdapter, dir: this.getRootDir(), ref: name });
            try {
              const tagObject = await git.readTag({ fs: fsAdapter, dir: this.getRootDir(), oid });
              tags.push({
                name,
                message: tagObject.tag.message,
                timestamp: tagObject.tag.tagger.timestamp * 1000,
                commit: tagObject.tag.object,
              });
            } catch {
              // Lightweight tag - get commit info
              const [log] = await git.log({
                fs: fsAdapter,
                dir: this.getRootDir(),
                ref: oid,
                depth: 1,
              });
              tags.push({
                name,
                message: log.commit.message,
                timestamp: log.commit.committer.timestamp * 1000,
                commit: oid,
              });
            }
          }
        } catch (e) {
          console.warn(`Failed to read tag ${name}:`, e);
        }
      }

      return tags.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Failed to get tags with details:', error);
      return [];
    }
  }

  // ========== REMOTE OPERATIONS ==========

  /**
   * Add a remote repository
   */
  async addRemote(name: string, url: string): Promise<void> {
    if (!this.initialized) {
      throw new Error('Git service not initialized');
    }

    if (isElectronEnv()) {
      const result = await window.electronAPI!.git.addRemote(this.getRootDir(), name, url);
      if (result.error) throw new Error(result.error);
    } else {
      await git.addRemote({
        fs: fsAdapter,
        dir: this.getRootDir(),
        remote: name,
        url,
      });
    }
    debug.log(`[addRemote] Added remote '${name}': ${url}`);
  }

  /**
   * Remove a remote repository
   */
  async removeRemote(name: string): Promise<void> {
    if (!this.initialized) {
      throw new Error('Git service not initialized');
    }

    if (isElectronEnv()) {
      const result = await window.electronAPI!.git.removeRemote(this.getRootDir(), name);
      if (result.error) throw new Error(result.error);
    } else {
      await git.deleteRemote({
        fs: fsAdapter,
        dir: this.getRootDir(),
        remote: name,
      });
    }
    debug.log(`[removeRemote] Removed remote '${name}'`);
  }

  /**
   * List all configured remotes
   */
  async getRemotes(): Promise<{ name: string; url: string }[]> {
    if (!this.initialized) {
      return [];
    }

    try {
      if (isElectronEnv()) {
        const result = await window.electronAPI!.git.listRemotes(this.getRootDir());
        if ('error' in result) throw new Error(result.error);
        return result;
      }
      const remotes = await git.listRemotes({
        fs: fsAdapter,
        dir: this.getRootDir(),
      });
      return remotes.map((r) => ({ name: r.remote, url: r.url }));
    } catch (error) {
      console.error('[getRemotes] Failed:', error);
      return [];
    }
  }

  /**
   * Check if a remote is configured
   */
  async hasRemote(name: string = 'origin'): Promise<boolean> {
    const remotes = await this.getRemotes();
    return remotes.some((r) => r.name === name);
  }

  /**
   * Ensure authentication token is loaded from disk/localStorage
   */
  private async ensureTokenLoaded(): Promise<void> {
    if (this.tokenLoaded) return;

    try {
      if (isElectronEnv()) {
        const result = await window.electronAPI!.secure.getToken();
        if (result.token) {
          this.authToken = result.token;
          this.tokenLoaded = true;
          return;
        }

        // Migration from localStorage if exists
        const oldToken = localStorage.getItem('git-remote-token');
        if (oldToken) {
          debug.log('[ensureTokenLoaded] Migrating token to secure storage');
          await this.setAuthToken(oldToken);
          localStorage.removeItem('git-remote-token');
          return;
        }
      } else {
        this.authToken = localStorage.getItem('git-remote-token');
      }
    } catch (err) {
      console.warn('[ensureTokenLoaded] Failed:', err);
    }
    this.tokenLoaded = true;
  }

  /**
   * Get stored authentication token
   * Note: ensureTokenLoaded() must be called once before this (is called in init)
   */
  getAuthToken(): string | null {
    if (!this.tokenLoaded) {
      // Fallback for immediate access, though unreliable in Electron if not yet initialized
      return this.authToken || localStorage.getItem('git-remote-token');
    }
    return this.authToken;
  }

  /**
   * Set authentication token
   */
  async setAuthToken(token: string): Promise<void> {
    this.authToken = token;
    this.tokenLoaded = true;

    try {
      if (isElectronEnv()) {
        const result = await window.electronAPI!.secure.setToken(token);
        if (result.error) throw new Error(result.error);
      } else {
        localStorage.setItem('git-remote-token', token);
      }
    } catch (err) {
      console.warn('[setAuthToken] Failed:', err);
      // Fallback to localStorage even in Electron if secure storage fails
      try {
        localStorage.setItem('git-remote-token', token);
      } catch {
        // Ignore
      }
    }
  }

  /**
   * Clear authentication token
   */
  async clearAuthToken(): Promise<void> {
    this.authToken = null;
    this.tokenLoaded = true;

    try {
      if (isElectronEnv()) {
        await window.electronAPI!.secure.removeToken();
      }
      localStorage.removeItem('git-remote-token');
    } catch {
      // Ignore
    }
  }

  /**
   * Create auth callback for git operations
   */
  private getAuthCallback() {
    const token = this.getAuthToken();
    if (!token) return undefined;

    return {
      onAuth: () => ({
        username: 'x-access-token',
        password: token, // GitHub PAT as password
      }),
    };
  }

  /**
   * Fetch from remote repository
   */
  async fetch(remote: string = 'origin', branch?: string): Promise<void> {
    if (!this.initialized) {
      throw new Error('Git service not initialized');
    }

    const token = this.getAuthToken();
    if (!token) {
      throw new Error('No authentication token configured. Please set a token first.');
    }

    try {
      if (isElectronEnv()) {
        const result = await window.electronAPI!.git.fetch(
          this.getRootDir(),
          remote,
          branch,
          token
        );
        if (result.error) throw new Error(result.error);
      } else {
        const auth = this.getAuthCallback();
        await git.fetch({
          fs: fsAdapter,
          http: await import('isomorphic-git/http/web').then((m) => m.default),
          dir: this.getRootDir(),
          corsProxy: 'https://corsproxy.io/?',
          remote,
          ref: branch,
          singleBranch: !!branch,
          ...auth,
        });
      }
      debug.log(`[fetch] Fetched from ${remote}${branch ? '/' + branch : ''}`);
    } catch (error) {
      console.error('[fetch] Failed:', error);
      throw error;
    }
  }

  /**
   * Push to remote repository
   */
  async push(remote: string = 'origin', branch: string = 'main'): Promise<void> {
    if (!this.initialized) {
      throw new Error('Git service not initialized');
    }

    const token = this.getAuthToken();
    if (!token) {
      throw new Error('No authentication token configured. Please set a token first.');
    }

    if (isElectronEnv()) {
      const result = await window.electronAPI!.git.push(this.getRootDir(), remote, branch, token);
      if (result.error) throw new Error(result.error);
    } else {
      const auth = this.getAuthCallback();
      await git.push({
        fs: fsAdapter,
        http: await import('isomorphic-git/http/web').then((m) => m.default),
        dir: this.getRootDir(),
        corsProxy: 'https://corsproxy.io/?',
        remote,
        ref: branch,
        ...auth,
      });
    }
    debug.log(`[push] Pushed to ${remote}/${branch}`);
  }

  /**
   * Pull from remote repository (fetch + merge)
   * Returns list of conflicted files if merge conflicts occur
   */
  async pull(
    remote: string = 'origin',
    branch: string = 'main'
  ): Promise<{ success: boolean; conflicts: string[] }> {
    if (!this.initialized) {
      throw new Error('Git service not initialized');
    }

    const token = this.getAuthToken();
    if (!token) {
      throw new Error('No authentication token configured. Please set a token first.');
    }

    try {
      if (isElectronEnv()) {
        const result = await window.electronAPI!.git.pull(
          this.getRootDir(),
          remote,
          branch,
          token,
          { name: 'Tracyfy User', email: 'user@tracyfy.local' }
        );
        if (result.error) throw new Error(result.error);
        if (!result.ok) {
          return { success: false, conflicts: result.conflicts || [] };
        }
        debug.log(`[pull] Pulled from ${remote}/${branch}`);
        return { success: true, conflicts: [] };
      }

      const auth = this.getAuthCallback();
      await git.pull({
        fs: fsAdapter,
        http: await import('isomorphic-git/http/web').then((m) => m.default),
        dir: this.getRootDir(),
        corsProxy: 'https://corsproxy.io/?',
        remote,
        ref: branch,
        author: { name: 'Tracyfy User', email: 'user@tracyfy.local' },
        ...auth,
      });
      debug.log(`[pull] Pulled from ${remote}/${branch}`);
      return { success: true, conflicts: [] };
    } catch (error: unknown) {
      const err = error as { code?: string; data?: { filepaths?: string[] } };
      if (err?.code === 'MergeConflictError' || err?.code === 'CheckoutConflictError') {
        const conflicts = err.data?.filepaths || [];
        console.warn(`[pull] Merge conflicts in: ${conflicts.join(', ')}`);
        return { success: false, conflicts };
      }
      throw error;
    }
  }

  /**
   * Pull only the counters folder (for ID synchronization)
   * This is a lightweight operation for artifact creation
   */
  async pullCounters(remote: string = 'origin', branch: string = 'main'): Promise<boolean> {
    if (!this.initialized || !(await this.hasRemote(remote))) {
      return false; // No remote configured, skip sync
    }

    try {
      // Fetch latest from remote
      await this.fetch(remote, branch);

      // Check if counters have changed
      const remoteRef = `${remote}/${branch}`;
      let localHead: string;
      let remoteHead: string;

      if (isElectronEnv()) {
        const rootDir = this.getRootDir();
        localHead = await window.electronAPI!.git.resolveRef(rootDir, 'HEAD');
        try {
          remoteHead = await window.electronAPI!.git.resolveRef(rootDir, remoteRef);
        } catch {
          return false;
        }
      } else {
        localHead = await git.resolveRef({
          fs: fsAdapter,
          dir: this.getRootDir(),
          ref: 'HEAD',
        });
        try {
          remoteHead = await git.resolveRef({
            fs: fsAdapter,
            dir: this.getRootDir(),
            ref: remoteRef,
          });
        } catch {
          // Remote ref doesn't exist yet
          return false;
        }
      }

      if (localHead === remoteHead) {
        return true; // Already up to date
      }

      // Get counter files from remote
      const counterFiles = [
        'counters/requirements.md',
        'counters/usecases.md',
        'counters/testcases.md',
        'counters/information.md',
        'counters/risks.md',
        'counters/users.md',
      ];

      for (const file of counterFiles) {
        try {
          const content = await this.readFileAtCommit(file, remoteHead);
          if (content) {
            // Read local counter
            const localContent = await fileSystemService.readFile(file);
            const remoteValue = parseInt(content.trim(), 10) || 0;
            const localValue = parseInt(localContent?.trim() || '0', 10);

            // Take the higher value (merge strategy for counters)
            if (remoteValue > localValue) {
              await fileSystemService.writeFile(file, String(remoteValue));
              debug.log(`[pullCounters] Updated ${file}: ${localValue} -> ${remoteValue}`);
            }
          }
        } catch {
          // File might not exist on remote
        }
      }

      return true;
    } catch (error) {
      console.warn('[pullCounters] Failed:', error);
      return false;
    }
  }

  /**
   * Push counters folder to remote (for ID synchronization)
   */
  async pushCounters(remote: string = 'origin', branch: string = 'main'): Promise<boolean> {
    if (!this.initialized || !(await this.hasRemote(remote))) {
      return false; // No remote configured, skip sync
    }

    try {
      // Stage and commit counter files
      const counterFiles = [
        'counters/requirements.md',
        'counters/usecases.md',
        'counters/testcases.md',
        'counters/information.md',
        'counters/risks.md',
        'counters/users.md',
      ];
      const cache = {};
      let hasChanges = false;

      for (const file of counterFiles) {
        try {
          const exists = await fileSystemService.readFileBinary(file).then((b) => b !== null);
          if (exists) {
            if (isElectronEnv()) {
              const res = await window.electronAPI!.git.add(this.getRootDir(), file);
              if (res.error) throw new Error(res.error);
            } else {
              await git.add({ fs: fsAdapter, dir: this.getRootDir(), filepath: file, cache });
            }
            hasChanges = true;
          }
        } catch {
          // File might not exist
        }
      }

      if (!hasChanges) {
        return true; // Nothing to push
      }

      // Commit counter update
      const author = { name: 'Tracyfy Sync', email: 'sync@tracyfy.local' };
      const message = 'Sync: Update artifact counters';

      if (isElectronEnv()) {
        const res = await window.electronAPI!.git.commit(this.getRootDir(), message, author);
        if (res.error) throw new Error(res.error);
      } else {
        await git.commit({
          fs: fsAdapter,
          dir: this.getRootDir(),
          message,
          author,
          cache,
        });
      }

      // Push to remote
      await this.push(remote, branch);
      debug.log('[pushCounters] Pushed counter updates');
      return true;
    } catch (error) {
      console.warn('[pushCounters] Failed:', error);
      return false;
    }
  }

  /**
   * Check if initialized
   */
  /**
   * Get current branch name
   */
  async getCurrentBranch(): Promise<string> {
    if (!this.initialized) return 'main';
    try {
      if (isElectronEnv()) {
        const branch = await window.electronAPI!.git.currentBranch(this.getRootDir());
        return branch || 'main';
      }
      return (await git.currentBranch({ fs: fsAdapter, dir: this.getRootDir() })) || 'main';
    } catch {
      return 'main';
    }
  }

  /**
   * Get sync status between local and remote
   */
  async getSyncStatus(remote: string = 'origin', branch?: string): Promise<SyncStatus> {
    if (!this.initialized) return { ahead: false, behind: false, diverged: false };

    try {
      const activeBranch = branch || (await this.getCurrentBranch());
      const rootDir = this.getRootDir();
      const remoteRef = `${remote}/${activeBranch}`;

      let localOID: string | undefined;
      let remoteOID: string | undefined;

      // Component: helper to get commit details
      const getCommits = async (lRef: string, rRef: string) => {
        try {
          const localLog = await this.getHistory(undefined, 50, lRef);
          const remoteLog = await this.getHistory(undefined, 50, rRef);

          const localHashes = new Set(localLog.map((c) => c.hash));
          const remoteHashes = new Set(remoteLog.map((c) => c.hash));

          const aheadCommits = localLog.filter((c) => !remoteHashes.has(c.hash));
          const behindCommits = remoteLog.filter((c) => !localHashes.has(c.hash));

          return { aheadCommits, behindCommits };
        } catch (e) {
          console.error('[getSyncStatus] Failed to get commit details:', e);
          return { aheadCommits: [], behindCommits: [] };
        }
      };

      if (isElectronEnv()) {
        try {
          localOID = await window.electronAPI!.git.resolveRef(rootDir, 'HEAD');
        } catch {
          return { ahead: false, behind: false, diverged: false };
        }

        try {
          remoteOID = await window.electronAPI!.git.resolveRef(rootDir, remoteRef);
        } catch {
          // If no remote yet, all local is "ahead" if it exists
          return { ahead: !!localOID, behind: false, diverged: false, aheadCommits: [] };
        }

        if (localOID === remoteOID) return { ahead: false, behind: false, diverged: false };

        const aheadResult = await window.electronAPI!.git.isDescendent(
          rootDir,
          localOID,
          remoteOID
        );
        const behindResult = await window.electronAPI!.git.isDescendent(
          rootDir,
          remoteOID,
          localOID
        );

        const ahead = aheadResult === true;
        const behind = behindResult === true;
        const diverged = !ahead && !behind;

        const { aheadCommits, behindCommits } = await getCommits('HEAD', remoteRef);

        return {
          ahead: ahead && !behind,
          behind: behind && !ahead,
          diverged,
          aheadCommits,
          behindCommits,
        };
      } else {
        try {
          localOID = await git.resolveRef({ fs: fsAdapter, dir: rootDir, ref: 'HEAD' });
        } catch {
          return { ahead: false, behind: false, diverged: false };
        }

        try {
          remoteOID = await git.resolveRef({ fs: fsAdapter, dir: rootDir, ref: remoteRef });
        } catch {
          return { ahead: !!localOID, behind: false, diverged: false };
        }

        if (localOID === remoteOID) return { ahead: false, behind: false, diverged: false };

        const aheadResult = await git.isDescendent({
          fs: fsAdapter,
          dir: rootDir,
          oid: localOID!,
          ancestor: remoteOID!,
        });
        const behindResult = await git.isDescendent({
          fs: fsAdapter,
          dir: rootDir,
          oid: remoteOID!,
          ancestor: localOID!,
        });

        const ahead = aheadResult === true;
        const behind = behindResult === true;
        const diverged = !ahead && !behind;

        const { aheadCommits, behindCommits } = await getCommits('HEAD', remoteRef);

        return {
          ahead: ahead && !behind,
          behind: behind && !ahead,
          diverged,
          aheadCommits,
          behindCommits,
        };
      }
    } catch (error) {
      console.error('[getSyncStatus] Failed:', error);
      return { ahead: false, behind: false, diverged: false };
    }
  }

  /**
   * Check if initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

export const realGitService = new RealGitService();
