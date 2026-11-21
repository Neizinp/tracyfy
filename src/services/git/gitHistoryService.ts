/**
 * Git History Service
 *
 * Handles commit history, file reading at specific commits, and project snapshots.
 */

import { debug } from '../../utils/debug';
import { fileSystemService } from '../fileSystemService';
import { gitBackend, getRootDir } from './gitBackend';
import { ARTIFACT_KINDS, type ArtifactKindId } from '../../domain/artifactKinds';
import { parseArtifact, parseLink } from '../../domain/artifactFormat';
import { STORED_TYPES } from '../storedTypes';
import type { CommitInfo } from './types';
import type { BaseArtifact, Link } from '../../types';

/** Every artifact and link at one commit; files that cannot be read are left out */
export interface ProjectSnapshot {
  artifacts: Record<ArtifactKindId, BaseArtifact[]>;
  links: Link[];
}

class GitHistoryService {
  private initialized = false;
  // Cache for getCommitFiles results (commit hash -> files)
  private commitFilesCache = new Map<string, string[]>();
  // Path to cache file in project folder
  // Local per-clone cache: lives inside .git so it is never tracked or pushed
  private readonly CACHE_FILE = '.git/tracyfy-commit-cache.json';
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
      return await gitBackend().log(getRootDir(), { depth, filepath, ref });
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
      const backend = gitBackend();
      const rootDir = getRootDir();
      const [commitLog] = await backend.log(rootDir, { depth: 1, ref: commitHash });
      if (!commitLog) return [];
      const parentHash = commitLog.parent?.[0];
      const currentFiles = await backend.listFiles(rootDir, commitHash);
      const parentFiles = parentHash ? await backend.listFiles(rootDir, parentHash) : [];

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
    const bytes = await this.readBytesAtCommit(filepath, commitHash);
    return bytes && new TextDecoder().decode(bytes);
  }

  /** A file's bytes at a commit (an image), or null when it did not exist then */
  async readBytesAtCommit(filepath: string, commitHash: string): Promise<Uint8Array | null> {
    if (!this.initialized) {
      throw new Error('Git service not initialized');
    }

    try {
      return await gitBackend().readBlob(getRootDir(), commitHash, filepath);
    } catch (error: unknown) {
      const err = error as { code?: string };
      if (err?.code === 'NotFoundError') {
        return null;
      }
      console.error(
        '[readBytesAtCommit] Unexpected error reading',
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
      return await gitBackend().listFiles(getRootDir(), commitHash);
    } catch (error) {
      console.error('[listFilesAtCommit] Failed to list files:', error);
      return [];
    }
  }

  /** Every artifact and link at a commit */
  async loadProjectSnapshot(commitHash: string): Promise<ProjectSnapshot> {
    const snapshot: ProjectSnapshot = {
      artifacts: Object.fromEntries(ARTIFACT_KINDS.map((k) => [k.id, []])) as unknown as Record<
        ArtifactKindId,
        BaseArtifact[]
      >,
      links: [],
    };
    const allFiles = await this.listFilesAtCommit(commitHash);

    /** Files of a folder at the commit, parsed; unreadable ones are skipped */
    const readFolder = async <T>(folder: string, parse: (id: string, text: string) => T) => {
      const files = allFiles.filter((f) => f.startsWith(`${folder}/`) && f.endsWith('.md'));
      const items: T[] = [];
      for (const file of files) {
        const content = await this.readFileAtCommit(file, commitHash);
        if (!content) continue;
        try {
          items.push(parse(file.slice(folder.length + 1, -'.md'.length), content));
        } catch (err) {
          debug.warn(`[loadProjectSnapshot] ${file} at ${commitHash}:`, err);
        }
      }
      return items;
    };

    await Promise.all([
      ...ARTIFACT_KINDS.map(async (k) => {
        snapshot.artifacts[k.id] = await readFolder(k.folder, (id, text) =>
          parseArtifact(k.id, id, text)
        );
      }),
      (async () => {
        snapshot.links = await readFolder(STORED_TYPES.link.folder, parseLink);
      })(),
    ]);
    return snapshot;
  }
}

export const gitHistoryService = new GitHistoryService();
