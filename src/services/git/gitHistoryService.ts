/**
 * Git History Service
 *
 * Handles commit history, file reading at specific commits, and project snapshots.
 */

import { debug } from '../../utils/debug';
import git from 'isomorphic-git';
import { fileSystemService } from '../fileSystemService';
import { fsAdapter } from '../fsAdapter';
import { isElectronEnv, type CommitInfo } from './types';
import type { Requirement, UseCase, TestCase, Information } from '../../types';
import {
  markdownToRequirement,
  markdownToUseCase,
  markdownToTestCase,
  markdownToInformation,
} from '../../utils/markdownUtils';

/**
 * Get the root directory path (Electron uses absolute path, browser uses '.')
 */
function getRootDir(): string {
  if (isElectronEnv()) {
    const rootPath = fileSystemService.getRootPath();
    return rootPath || '.';
  }
  return '.';
}

class GitHistoryService {
  private initialized = false;
  // Cache for getCommitFiles results (commit hash -> files)
  private commitFilesCache = new Map<string, string[]>();
  // Path to cache file in project folder
  private readonly CACHE_FILE = '.tracyfy/commit-cache.json';
  // Flag to track if cache has been loaded from disk
  private cacheLoadedFromDisk = false;

  setInitialized(value: boolean): void {
    this.initialized = value;
  }

  /**
   * Load commit files cache from disk
   */
  async loadCacheFromDisk(): Promise<void> {
    if (this.cacheLoadedFromDisk) return;

    try {
      const content = await fileSystemService.readFile(this.CACHE_FILE);
      if (!content) return; // No cache file exists yet
      const data = JSON.parse(content) as Record<string, string[]>;
      for (const [hash, files] of Object.entries(data)) {
        this.commitFilesCache.set(hash, files);
      }
      debug.log(
        `[GitHistoryService] Loaded ${Object.keys(data).length} cached commit files from disk`
      );
    } catch {
      // Cache file doesn't exist yet - that's fine
    }
    this.cacheLoadedFromDisk = true;
  }

  /**
   * Save commit files cache to disk
   */
  async saveCacheToDisk(): Promise<void> {
    try {
      const data: Record<string, string[]> = {};
      for (const [hash, files] of this.commitFilesCache.entries()) {
        data[hash] = files;
      }
      await fileSystemService.writeFile(this.CACHE_FILE, JSON.stringify(data, null, 2));
    } catch (err) {
      debug.warn('[GitHistoryService] Failed to save commit cache to disk:', err);
    }
  }

  /**
   * Add entry to cache (called from commitFile)
   */
  addToCache(commitHash: string, files: string[]): void {
    this.commitFilesCache.set(commitHash, files);
    void this.saveCacheToDisk();
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
        commits = await window.electronAPI!.git.log(getRootDir(), depth, filepath, ref);
      } else {
        // Browser path: use fsAdapter
        const logs = await git.log({
          fs: fsAdapter,
          dir: getRootDir(),
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
        const rootDir = getRootDir();
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
          dir: getRootDir(),
          ref: commitHash,
          depth: 1,
        });

        const commitLog = logs[0];
        if (!commitLog) return [];

        parentHash = commitLog.commit.parent[0];

        // Get files in this commit's tree
        currentFiles = await git.listFiles({
          fs: fsAdapter,
          dir: getRootDir(),
          ref: commitHash,
        });

        if (parentHash) {
          // Get files in parent's tree
          parentFiles = await git.listFiles({
            fs: fsAdapter,
            dir: getRootDir(),
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
        const result = await window.electronAPI!.git.readBlob(getRootDir(), commitHash, filepath);
        if (result.error) {
          if (result.error.includes('NotFoundError')) return null;
          throw new Error(result.error);
        }
        if (!result.blob) return null;
        return new TextDecoder().decode(new Uint8Array(result.blob));
      } else {
        const result = await git.readBlob({
          fs: fsAdapter,
          dir: getRootDir(),
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
   * List files at a specific commit
   */
  async listFilesAtCommit(commitHash: string): Promise<string[]> {
    if (!this.initialized) {
      return [];
    }

    try {
      if (isElectronEnv()) {
        return await window.electronAPI!.git.listFiles(getRootDir(), commitHash);
      } else {
        return await git.listFiles({
          fs: fsAdapter,
          dir: getRootDir(),
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
}

export const gitHistoryService = new GitHistoryService();
