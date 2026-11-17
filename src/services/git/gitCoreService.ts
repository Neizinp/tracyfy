/**
 * Git Core Service
 *
 * Handles core git operations: initialization, status and commits.
 */

import { debug } from '../../utils/debug';
import { fileSystemService } from '../fileSystemService';
import { fsAdapter } from '../fsAdapter';
import { gitBackend, getRootDir } from './gitBackend';
import { isElectronEnv, parseStatusMatrix, type FileStatus } from './types';
import { STORED_TYPES } from '../storedTypes';

export { DetachedHeadError } from './gitBackend';

class GitCoreService {
  private initialized = false;
  // Commit queue to serialize git commits (prevents race conditions)
  private commitQueue: Promise<void> = Promise.resolve();
  // Callback to add cache entries (set by facade)
  private addToCacheFn: (commitHash: string, files: string[]) => void = () => {};
  // Callback to ensure token is loaded
  private ensureTokenLoadedFn: () => Promise<void> = async () => {};

  setInitialized(value: boolean): void {
    this.initialized = value;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  setAddToCacheFn(fn: (commitHash: string, files: string[]) => void): void {
    this.addToCacheFn = fn;
  }

  setEnsureTokenLoadedFn(fn: () => Promise<void>): void {
    this.ensureTokenLoadedFn = fn;
  }

  /**
   * Initialize git with the selected directory
   */
  async init(directoryHandle?: FileSystemDirectoryHandle): Promise<boolean> {
    debug.log('[gitCoreService.init] Starting, isElectron:', isElectronEnv());

    // Browser path: set FSA handle
    if (!isElectronEnv() && directoryHandle) {
      fsAdapter.setRoot(directoryHandle);
    }

    // For Electron, verify we have a root path
    if (isElectronEnv()) {
      const rootPath = fileSystemService.getRootPath();
      debug.log('[gitCoreService.init] Electron rootPath:', rootPath);
      if (!rootPath) {
        console.error('[gitCoreService.init] No root path set in Electron mode!');
        return false;
      }
    }

    // Check if .git exists
    const hasGit = await fileSystemService.checkGitExists();
    debug.log('[gitCoreService.init] hasGit:', hasGit);

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
    debug.log('[gitCoreService.init] hasValidRepo:', hasValidRepo);

    if (!hasGit || !hasValidRepo) {
      if (hasGit && !hasValidRepo) {
        debug.warn('[init] Incomplete git repository detected - will reinitialize');

        // Recreate HEAD pointing to main so git operations can proceed
        try {
          await fileSystemService.writeFile('.git/HEAD', 'ref: refs/heads/main\n');
          await fileSystemService.writeFile('.git/refs/heads/main', '');
        } catch (err) {
          console.error('[init] Failed to recreate HEAD', err);
        }
      }

      debug.log('[init] Auto-initializing git repository...');
      try {
        await gitBackend().init(getRootDir());
      } catch (err) {
        console.error('[init] Git init failed:', err);
        return false;
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
        if ((await fileSystemService.readFile(file.path)) === null) {
          await fileSystemService.writeFile(file.path, file.content);
        }
      } catch {
        await fileSystemService.writeFile(file.path, file.content);
      }
    }

    await this.ensureTokenLoadedFn();
    return true;
  }

  /**
   * Get git status
   */
  async getStatus(): Promise<FileStatus[]> {
    if (!this.initialized) return [];

    try {
      let result: FileStatus[] = [];
      let statusMatrixFiles = new Set<string>();

      // Throws if git can't be read: never report "no changes" in that case
      const parsed = parseStatusMatrix(await gitBackend().statusMatrix(getRootDir()));
      result = parsed.statuses;
      statusMatrixFiles = parsed.allFiles;

      // Enumerate artifact files to find untracked files (in parallel for speed)
      const trackedPaths =
        statusMatrixFiles.size > 0 ? statusMatrixFiles : new Set(result.map((f) => f.path));
      const untrackedFiles: FileStatus[] = [];

      // Every folder the app writes one file per item to
      const artifactTypes = [...Object.values(STORED_TYPES).map((t) => t.folder), 'assets'];
      const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp', '.tiff'];

      // Parallel enumeration of all artifact directories
      const listPromises = artifactTypes.map(async (type) => {
        const filesForType: FileStatus[] = [];
        try {
          const files = await fileSystemService.listFiles(type);
          for (const file of files) {
            const isMarkdown = file.endsWith('.md');
            const isImage =
              type === 'assets' && imageExtensions.some((ext) => file.toLowerCase().endsWith(ext));
            if (isMarkdown || isImage) {
              const filePath = `${type}/${file}`;
              if (!trackedPaths.has(filePath)) {
                filesForType.push({ path: filePath, status: 'new' });
              }
            }
          }
        } catch {
          // Directory might not exist yet
        }
        return filesForType;
      });

      const allUntrackedArrays = await Promise.all(listPromises);
      for (const arr of allUntrackedArrays) {
        untrackedFiles.push(...arr);
      }

      return [...result, ...untrackedFiles];
    } catch (error) {
      // Callers must surface this; an empty list would look like "everything committed"
      console.error('Failed to get status:', error);
      throw error;
    }
  }

  /**
   * Commit a single file. The author is the repository's user.name (P5).
   */
  async commitFile(filepath: string, message: string): Promise<void> {
    if (!this.initialized) {
      throw new Error('Git service not initialized');
    }

    // Queue the commit to ensure serialized execution
    this.commitQueue = this.commitQueue.then(async () => {
      try {
        debug.log(`[commitFile] Starting commit for ${filepath}...`);
        const fileExists = (await fileSystemService.readFileBinary(filepath)) !== null;
        debug.log(`[commitFile] File exists: ${fileExists}`);

        // Stage the file (or its deletion) and commit; HEAD safety is part of commitPaths
        const commitOid = await gitBackend().commitPaths(
          getRootDir(),
          fileExists ? { add: [filepath] } : { remove: [filepath] },
          message
        );

        debug.log(`[commitFile] Successfully committed ${filepath} SHA: ${commitOid}`);

        // Proactively cache the file for this commit
        this.addToCacheFn(commitOid, [filepath]);

        // Dispatch event to notify UI of status change
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('git-status-changed'));
        }
      } catch (error) {
        // Log the error with full details before rethrowing
        console.error(`[commitFile] Failed to commit ${filepath}:`, error);
        throw error;
      }
    });

    // Wait for our commit to complete
    await this.commitQueue;
  }

  /**
   * Revert changes to a file (Discard Changes)
   */
  async revertFile(filepath: string): Promise<void> {
    if (!this.initialized) {
      throw new Error('Git service not initialized');
    }

    debug.log(`[revertFile] Attempting to revert: ${filepath}`);

    // Check if file exists on disk (new/untracked) vs tracked
    const fileExists = (await fileSystemService.readFileBinary(filepath)) !== null;

    // Use single-file statusMatrix to check if tracked (much faster than getStatus())
    const status = await gitBackend().statusMatrix(getRootDir(), [filepath]);
    // A file is tracked if it exists in HEAD (entry[1] === 1)
    const isTracked = status.length > 0 && status[0][1] === 1;

    debug.log(`[revertFile] File exists: ${fileExists}, isTracked: ${isTracked}`);

    if (!isTracked && fileExists) {
      // Untracked file: Delete it from disk
      debug.log(`[revertFile] Deleting untracked file: ${filepath}`);
      await fileSystemService.deleteFile(filepath);
    } else if (isTracked) {
      // Tracked/Modified file: Revert using git checkout
      debug.log(`[revertFile] Checking out ${filepath} from HEAD`);
      await gitBackend().checkoutFile(getRootDir(), filepath);
    } else {
      debug.warn(`[revertFile] File not found: ${filepath}`);
      return;
    }

    debug.log(`[revertFile] Successfully reverted ${filepath}`);

    // Dispatch event to notify UI of status change
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('git-status-changed'));
    }
  }
}

export const gitCoreService = new GitCoreService();
