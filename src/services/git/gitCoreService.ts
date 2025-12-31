/**
 * Git Core Service
 *
 * Handles core git operations: initialization, status, commits, and file operations.
 */

import { debug } from '../../utils/debug';
import git from 'isomorphic-git';
import { fileSystemService } from '../fileSystemService';
import { fsAdapter } from '../fsAdapter';
import { isElectronEnv, parseStatusMatrix, type FileStatus, type ArtifactFolder } from './types';
import type {
  Requirement,
  UseCase,
  TestCase,
  Information,
  Risk,
  Link,
  Workflow,
  ArtifactDocument,
} from '../../types';
import {
  requirementToMarkdown,
  convertUseCaseToMarkdown,
  testCaseToMarkdown,
  informationToMarkdown,
  riskToMarkdown,
  documentToMarkdown,
  markdownToRequirement,
  markdownToUseCase,
  markdownToTestCase,
  markdownToInformation,
  markdownToRisk,
  markdownToDocument,
} from '../../utils/markdownUtils';
import { linkToMarkdown, parseMarkdownLink } from '../../utils/linkMarkdownUtils';
import { workflowToMarkdown, parseMarkdownWorkflow } from '../../utils/workflowMarkdownUtils';

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

class GitCoreService {
  private initialized = false;
  // Commit queue to serialize git commits (prevents race conditions)
  private commitQueue: Promise<void> = Promise.resolve();
  // Callback to add cache entries (set by facade)
  private addToCacheFn: (commitHash: string, files: string[]) => void = () => {};
  // Callback to ensure token is loaded
  private ensureTokenLoadedFn: () => Promise<void> = async () => {};
  // Track recently committed files to filter stale statusMatrix results
  // isomorphic-git's statusMatrix can return stale data immediately after commit
  private recentlyCommittedFiles: Map<string, number> = new Map();
  private readonly COMMIT_GRACE_PERIOD_MS = 5000; // 5 second grace period
  // Cache HEAD attached state to avoid checking on every commit
  private headAttachedVerified = false;
  // Short-term cache for getStatus to avoid repeated enumeration
  private statusCache: { result: import('./types').FileStatus[]; timestamp: number } | null = null;
  private readonly STATUS_CACHE_TTL_MS = 500; // 500ms cache

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
   * Invalidate the status cache (for tests or forced refresh)
   */
  invalidateStatusCache(): void {
    this.statusCache = null;
  }

  /**
   * Ensure HEAD is attached to main branch (not detached).
   * If HEAD contains a raw SHA instead of "ref: refs/heads/main",
   * this repairs it to be a symbolic reference.
   * This is critical for commits to update the branch pointer.
   */
  private async ensureHeadAttached(): Promise<void> {
    if (isElectronEnv()) {
      // Electron handles this through native git
      return;
    }

    // Skip if we've already verified HEAD is attached this session
    if (this.headAttachedVerified) {
      return;
    }

    try {
      const headContent = await fsAdapter.promises.readFile('.git/HEAD', { encoding: 'utf8' });
      const trimmedHead = (headContent as string).trim();

      // Check if HEAD is detached (contains raw SHA instead of symbolic ref)
      const isDetached = !trimmedHead.startsWith('ref: ');

      if (isDetached) {
        console.log(
          `[ensureHeadAttached] HEAD is detached (contains: "${trimmedHead.substring(0, 20)}..."). Repairing to attach to main branch.`
        );

        // If there's a commit SHA in HEAD, make sure refs/heads/main points to it
        const sha = trimmedHead;
        if (sha.match(/^[0-9a-f]{40}$/i)) {
          // Write the current SHA to refs/heads/main first
          try {
            await fsAdapter.promises.writeFile('.git/refs/heads/main', sha + '\n');
            console.log(`[ensureHeadAttached] Updated refs/heads/main to ${sha}`);
          } catch (err) {
            console.error('[ensureHeadAttached] Failed to update refs/heads/main:', err);
          }
        }

        // Now attach HEAD to main
        await fsAdapter.promises.writeFile('.git/HEAD', 'ref: refs/heads/main\n');
        console.log('[ensureHeadAttached] HEAD is now attached to refs/heads/main');
      } else {
        debug.log(`[ensureHeadAttached] HEAD is already attached: ${trimmedHead}`);
      }

      // Mark as verified for this session
      this.headAttachedVerified = true;
    } catch (err) {
      console.error('[ensureHeadAttached] Failed to check/repair HEAD:', err);
    }
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

      // In Electron, use IPC to initialize git - auto-init without prompting
      if (isElectronEnv()) {
        debug.log('[init] Auto-initializing git repository...');

        const rootDir = getRootDir();
        debug.log('[gitCoreService.init] Calling git.init with rootDir:', rootDir);
        const result = await window.electronAPI!.git.init(rootDir);
        if (result.error) {
          console.error('[init] Git init failed:', result.error);
          return false;
        }

        this.initialized = true;
        await this.ensureTokenLoadedFn();
        debug.log('[gitCoreService.init] Success! initialized =', this.initialized);
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
    // Clear status cache to ensure fresh status on next getStatus call
    this.statusCache = null;
    this.headAttachedVerified = false;

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

    await this.ensureTokenLoadedFn();
    return true;
  }

  /**
   * Save an artifact to disk (no commit)
   */
  async saveArtifact(
    type: ArtifactFolder,
    id: string,
    artifact:
      | Requirement
      | UseCase
      | TestCase
      | Information
      | Risk
      | Link
      | Workflow
      | ArtifactDocument
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
      case 'risks':
        markdown = riskToMarkdown(artifact as Risk);
        break;
      case 'links':
        markdown = linkToMarkdown(artifact as Link);
        break;
      case 'workflows':
        markdown = workflowToMarkdown(artifact as Workflow);
        break;
      case 'documents':
        markdown = documentToMarkdown(artifact as ArtifactDocument);
        break;
      default:
        // For types like projects, users, baselines that might use different serialization or are handled elsewhere
        // But we should support them if they are passed here
        markdown = JSON.stringify(artifact, null, 2);
    }

    const filePath = `${type}/${id}.md`;
    await fileSystemService.writeFile(filePath, markdown);
  }

  /**
   * Delete an artifact from disk (no commit)
   */
  async deleteArtifact(type: ArtifactFolder, id: string): Promise<void> {
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
      const resultRm = await window.electronAPI!.git.remove(getRootDir(), oldPath);
      if (resultRm.error) throw new Error(resultRm.error);

      const resultAdd = await window.electronAPI!.git.add(getRootDir(), newPath);
      if (resultAdd.error) throw new Error(resultAdd.error);

      const resultCommit = await window.electronAPI!.git.commit(getRootDir(), message);
      if (resultCommit.error) throw new Error(resultCommit.error);
      return;
    }

    // Browser path
    await git.remove({ fs: fsAdapter, dir: getRootDir(), filepath: oldPath, cache });
    await git.add({ fs: fsAdapter, dir: getRootDir(), filepath: newPath, cache });

    const author = { name: 'Tracyfy User', email: 'user@tracyfy.local' };
    await git.commit({
      fs: fsAdapter,
      dir: getRootDir(),
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

    // Return cached result if fresh
    const now = Date.now();
    if (this.statusCache && now - this.statusCache.timestamp < this.STATUS_CACHE_TTL_MS) {
      debug.log('[getStatus] Returning cached result');
      return this.statusCache.result;
    }

    try {
      let result: FileStatus[] = [];
      let statusMatrixFiles = new Set<string>();

      if (isElectronEnv()) {
        debug.log(
          '[gitCoreService.getStatus] Electron: calling window.electronAPI.git.statusMatrix'
        );
        const status = await window.electronAPI!.git.statusMatrix(getRootDir());
        if (Array.isArray(status)) {
          const parsed = parseStatusMatrix(status);
          result = parsed.statuses;
          statusMatrixFiles = parsed.allFiles;
        }
      } else {
        // Browser path: Use git.statusMatrix directly with fsAdapter
        // IMPORTANT: Use a fresh cache to avoid stale data after commits
        try {
          debug.log('[gitCoreService.getStatus] Browser: calling isomorphic-git.statusMatrix');
          const freshCache = {}; // Force fresh read to avoid stale refs/index
          const status = await git.statusMatrix({
            fs: fsAdapter,
            dir: getRootDir(),
            cache: freshCache,
          });
          debug.log(
            `[gitCoreService.getStatus] Browser: statusMatrix returned ${status?.length || 0} items`
          );
          if (Array.isArray(status)) {
            const parsed = parseStatusMatrix(status as [string, number, number, number][]);
            result = parsed.statuses;
            statusMatrixFiles = parsed.allFiles;
          }
        } catch (statusError) {
          console.error('[getStatus] statusMatrix failed:', statusError);
        }
      }

      // Enumerate artifact files to find untracked files (in parallel for speed)
      const trackedPaths =
        statusMatrixFiles.size > 0 ? statusMatrixFiles : new Set(result.map((f) => f.path));
      const untrackedFiles: FileStatus[] = [];

      const artifactTypes = [
        'requirements',
        'usecases',
        'testcases',
        'information',
        'risks',
        'links',
        'workflows',
        'custom-attributes',
        'documents',
        'projects',
        'assets',
      ];
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

      // Filter out recently committed files (grace period to avoid stale statusMatrix data)
      const now = Date.now();
      const filteredResult = [...result, ...untrackedFiles].filter((file) => {
        const commitTime = this.recentlyCommittedFiles.get(file.path);
        if (commitTime && now - commitTime < this.COMMIT_GRACE_PERIOD_MS) {
          debug.log(`[getStatus] Filtering recently committed file: ${file.path}`);
          return false;
        }
        return true;
      });

      // Clean up old entries
      for (const [path, time] of this.recentlyCommittedFiles.entries()) {
        if (now - time > this.COMMIT_GRACE_PERIOD_MS) {
          this.recentlyCommittedFiles.delete(path);
        }
      }

      // Cache the result
      this.statusCache = { result: filteredResult, timestamp: Date.now() };

      return filteredResult;
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
    this.commitQueue = this.commitQueue.then(async () => {
      try {
        debug.log(`[commitFile] Starting commit for ${filepath}...`);
        const fileExists = (await fileSystemService.readFileBinary(filepath)) !== null;
        debug.log(`[commitFile] File exists: ${fileExists}`);
        const authorNameToUse = authorName || 'Tracyfy User';
        const author = { name: authorNameToUse, email: 'user@tracyfy.local' };

        let commitOid: string;

        if (isElectronEnv()) {
          const rootDir = getRootDir();
          debug.log(`[commitFile] Electron mode, rootDir: ${rootDir}`);
          if (fileExists) {
            debug.log(`[commitFile] Adding file: ${filepath}`);
            const res = await window.electronAPI!.git.add(rootDir, filepath);
            if (res.error) {
              debug.warn(`[commitFile] git.add failed: ${res.error}`);
              throw new Error(`git.add failed: ${res.error}`);
            }
          } else {
            debug.log(`[commitFile] Removing file: ${filepath}`);
            const res = await window.electronAPI!.git.remove(rootDir, filepath);
            if (res.error) {
              debug.warn(`[commitFile] git.remove failed: ${res.error}`);
              throw new Error(`git.remove failed: ${res.error}`);
            }
          }

          debug.log(`[commitFile] Committing with message: "${message}"`);
          const res = await window.electronAPI!.git.commit(rootDir, message, author);
          if (res.error) {
            debug.warn(`[commitFile] git.commit failed: ${res.error}`);
            throw new Error(`git.commit failed: ${res.error}`);
          }
          commitOid = res.oid!;
        } else {
          // CRITICAL: Ensure HEAD is attached to main branch before committing
          // If HEAD is detached (contains raw SHA), commits won't update the branch pointer
          await this.ensureHeadAttached();

          const cache = {};

          if (fileExists) {
            debug.log(`[commitFile] Browser: calling git.add for ${filepath}`);
            await git.add({ fs: fsAdapter, dir: getRootDir(), filepath, cache });
          } else {
            debug.log(`[commitFile] Browser: calling git.remove for ${filepath}`);
            await git.remove({ fs: fsAdapter, dir: getRootDir(), filepath, cache });
          }

          debug.log(`[commitFile] Browser: calling git.commit with message: "${message}"`);
          commitOid = await git.commit({
            fs: fsAdapter,
            dir: getRootDir(),
            message,
            author,
            cache,
          });

          debug.log(`[commitFile] Browser: commit returned OID: ${commitOid}`);
        }

        debug.log(
          `[commitFile] Successfully committed ${filepath} by ${authorNameToUse}, SHA: ${commitOid}`
        );

        // Track this file as recently committed to filter stale statusMatrix results
        this.recentlyCommittedFiles.set(filepath, Date.now());

        // Invalidate status cache so next getStatus returns fresh data
        this.statusCache = null;

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
    let isTracked = false;
    if (isElectronEnv()) {
      const status = await window.electronAPI!.git.statusMatrix(getRootDir());
      if (Array.isArray(status)) {
        const fileEntry = status.find(
          (entry: [string, number, number, number]) => entry[0] === filepath
        );
        // A file is tracked if it exists in HEAD (entry[1] === 1)
        isTracked = fileEntry ? fileEntry[1] === 1 : false;
      }
    } else {
      const status = await git.statusMatrix({
        fs: fsAdapter,
        dir: getRootDir(),
        filepaths: [filepath],
      });
      // A file is tracked if it exists in HEAD (entry[1] === 1)
      isTracked = status.length > 0 && status[0][1] === 1;
    }

    debug.log(`[revertFile] File exists: ${fileExists}, isTracked: ${isTracked}`);

    if (!isTracked && fileExists) {
      // Untracked file: Delete it from disk
      debug.log(`[revertFile] Deleting untracked file: ${filepath}`);
      await fileSystemService.deleteFile(filepath);
    } else if (isTracked) {
      // Tracked/Modified file: Revert using git checkout
      debug.log(`[revertFile] Checking out ${filepath} from HEAD`);
      if (isElectronEnv()) {
        debug.log('[revertFile] Electron: calling git.checkout');
        const res = await window.electronAPI!.git.checkout(getRootDir(), filepath, true);
        if (res.error) {
          console.error(`[revertFile] Electron checkout failed: ${res.error}`);
          throw new Error(res.error);
        }
      } else {
        debug.log('[revertFile] Browser: calling isomorphic-git.checkout');
        await git.checkout({
          fs: fsAdapter,
          dir: getRootDir(),
          ref: 'HEAD',
          filepaths: [filepath],
          force: true,
        });
      }
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

  /**
   * Load all artifacts from disk
   */
  async loadAllArtifacts(): Promise<{
    requirements: Requirement[];
    useCases: UseCase[];
    testCases: TestCase[];
    information: Information[];
    risks: Risk[];
    links: Link[];
    workflows: Workflow[];
    documents: ArtifactDocument[];
  }> {
    // Helper to load files in parallel for a given folder and parser
    const loadArtifactType = async <T>(
      folder: string,
      parser: (content: string) => T | null
    ): Promise<T[]> => {
      try {
        const files = await fileSystemService.listFiles(folder);
        const mdFiles = files.filter((f) => f.endsWith('.md'));
        const contents = await Promise.all(
          mdFiles.map((file) => fileSystemService.readFile(`${folder}/${file}`))
        );
        const items: T[] = [];
        for (const content of contents) {
          if (content) {
            const item = parser(content);
            if (item) items.push(item);
          }
        }
        return items;
      } catch {
        return [];
      }
    };

    // Load all artifact types in parallel
    const [requirements, useCases, testCases, information, risks, links, workflows, documents] =
      await Promise.all([
        loadArtifactType('requirements', markdownToRequirement),
        loadArtifactType('usecases', markdownToUseCase),
        loadArtifactType('testcases', markdownToTestCase),
        loadArtifactType('information', markdownToInformation),
        loadArtifactType('risks', markdownToRisk),
        loadArtifactType('links', parseMarkdownLink),
        loadArtifactType('workflows', parseMarkdownWorkflow),
        loadArtifactType('documents', markdownToDocument),
      ]);

    return { requirements, useCases, testCases, information, risks, links, workflows, documents };
  }
}

export const gitCoreService = new GitCoreService();
