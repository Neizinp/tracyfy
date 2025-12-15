/**
 * Real Git Service - Uses isomorphic-git with File System Access API or Electron IPC
 *
 * In Electron, routes git operations through IPC to the main process (which uses Node fs).
 * In browsers, uses an adapter over the File System Access API.
 */

import git from 'isomorphic-git';
import { fileSystemService } from './fileSystemService';
import { fsAdapter } from './fsAdapter';
import type { Requirement, UseCase, TestCase, Information } from '../types';
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
        log: (dir: string, depth?: number, filepath?: string) => Promise<CommitInfo[]>;
        listFiles: (dir: string) => Promise<string[]>;
        resolveRef: (dir: string, ref: string) => Promise<string>;
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
      };
    };
  }
}

const isElectronEnv = () => typeof window !== 'undefined' && !!window.electronAPI?.isElectron;

export interface CommitInfo {
  hash: string;
  message: string;
  author: string;
  timestamp: number;
}

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
      console.log(
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
    // Browser path: set FSA handle
    if (!isElectronEnv() && directoryHandle) {
      fsAdapter.setRoot(directoryHandle);
    }

    // Check if .git exists
    const hasGit = await fileSystemService.checkGitExists();

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
        console.log('[init] Auto-initializing git repository...');

        const rootDir = this.getRootDir();
        const result = await window.electronAPI!.git.init(rootDir);
        if (result.error) {
          console.error('[init] Git init failed:', result.error);
          return false;
        }

        this.initialized = true;
        return true;
      }

      // Browser path: auto-initialize git without prompting
      console.log('[init] Auto-initializing git repository (browser)...');

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

    // 3. Stage the removal of the old file (git rm)
    await git.remove({ fs: fsAdapter, dir: this.getRootDir(), filepath: oldPath, cache });

    // 4. Stage the addition of the new file (git add)
    await git.add({ fs: fsAdapter, dir: this.getRootDir(), filepath: newPath, cache });

    // 5. Auto-commit the rename with a predefined message
    const oldName = oldPath.split('/').pop()?.replace('.md', '') || oldPath;
    const newName = newPath.split('/').pop()?.replace('.md', '') || newPath;
    const message = commitMessage || `Renamed project: ${oldName} → ${newName}`;

    await git.commit({
      fs: fsAdapter,
      dir: this.getRootDir(),
      message,
      author: { name: 'Tracyfy User', email: 'user@tracyfy.local' },
      cache,
    });

    console.log(`[renameFile] Committed rename: ${oldPath} -> ${newPath}`);
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
        'projects',
        'assets',
      ];
      const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp', '.tiff'];
      for (const type of artifactTypes) {
        try {
          const files = await fileSystemService.listFiles(type);
          if (type === 'assets') {
            console.log(`[getStatus] Assets folder contains: ${files.length} files`, files);
          }
          for (const file of files) {
            const isMarkdown = file.endsWith('.md');
            const isImage =
              type === 'assets' && imageExtensions.some((ext) => file.toLowerCase().endsWith(ext));
            if (isMarkdown || isImage) {
              const filePath = `${type}/${file}`;
              if (!trackedPaths.has(filePath)) {
                console.log(`[getStatus] Found untracked file: ${filePath}`);
                untrackedFiles.push({ path: filePath, status: 'new' });
              }
            }
          }
        } catch (err) {
          // Directory might not exist yet
          if (type === 'assets') {
            console.log(`[getStatus] Assets folder does not exist or error:`, err);
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
      const cache = {};

      if (fileExists) {
        await git.add({ fs: fsAdapter, dir: this.getRootDir(), filepath, cache });
      } else {
        // File doesn't exist, assume it's a deletion
        await git.remove({ fs: fsAdapter, dir: this.getRootDir(), filepath, cache });
      }

      const authorNameToUse = authorName || 'Tracyfy User';
      const commitOid = await git.commit({
        fs: fsAdapter,
        dir: this.getRootDir(),
        message,
        author: { name: authorNameToUse, email: 'user@tracyfy.local' },
        cache,
      });

      console.log(
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
      const loadFiles = async (prefix: string, parser: (md: string) => any, targetArray: any[]) => {
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
  async getHistory(filepath?: string): Promise<CommitInfo[]> {
    if (!this.initialized) {
      return [];
    }

    try {
      let commits: CommitInfo[];

      // Electron path: use IPC
      if (isElectronEnv()) {
        commits = await window.electronAPI!.git.log(this.getRootDir(), 100, filepath);
      } else {
        // Browser path: use fsAdapter
        const logs = await git.log({
          fs: fsAdapter,
          dir: this.getRootDir(),
          depth: 100,
          ref: 'HEAD',
          filepath: filepath || undefined,
        });
        commits = logs.map((log) => ({
          hash: log.oid,
          message: log.commit.message,
          author: log.commit.author.name,
          timestamp: log.commit.author.timestamp * 1000,
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
      // Get the commit to find its parent
      const [commitLog] = await git.log({
        fs: fsAdapter,
        dir: this.getRootDir(),
        ref: commitHash,
        depth: 1,
      });

      if (!commitLog) return [];

      const parentHash = commitLog.commit.parent[0]; // First parent

      // Get files in this commit's tree
      const currentFiles = await git.listFiles({
        fs: fsAdapter,
        dir: this.getRootDir(),
        ref: commitHash,
      });

      if (!parentHash) {
        // Initial commit - all files are new
        this.commitFilesCache.set(commitHash, currentFiles);
        void this.saveCacheToDisk(); // Save in background
        return currentFiles;
      }

      // Get files in parent's tree
      const parentFiles = await git.listFiles({
        fs: fsAdapter,
        dir: this.getRootDir(),
        ref: parentHash,
      });

      // Find added/deleted files (fast check)
      const currentSet = new Set(currentFiles);
      const parentSet = new Set(parentFiles);
      const changedFiles: string[] = [];

      // Added files
      for (const file of currentFiles) {
        if (!parentSet.has(file)) {
          changedFiles.push(file);
        }
      }

      // Deleted files
      for (const file of parentFiles) {
        if (!currentSet.has(file)) {
          changedFiles.push(file);
        }
      }

      // If no added/deleted, try to find modified file from commit message
      if (changedFiles.length === 0) {
        const msg = commitLog.commit.message.toLowerCase();
        for (const file of currentFiles) {
          const filename = file.split('/').pop()?.replace('.md', '') || '';
          if (msg.includes(filename.toLowerCase())) {
            changedFiles.push(file);
            break;
          }
        }
      }

      // Still nothing? Compare blobs to find modified file (slower but accurate)
      if (changedFiles.length === 0) {
        for (const file of currentFiles) {
          if (parentSet.has(file)) {
            try {
              const [currentBlob, parentBlob] = await Promise.all([
                git.readBlob({
                  fs: fsAdapter,
                  dir: this.getRootDir(),
                  oid: commitHash,
                  filepath: file,
                }),
                git.readBlob({
                  fs: fsAdapter,
                  dir: this.getRootDir(),
                  oid: parentHash,
                  filepath: file,
                }),
              ]);
              if (currentBlob.oid !== parentBlob.oid) {
                changedFiles.push(file);
                break; // One file per commit, so stop after finding it
              }
            } catch {
              // Skip files that can't be read
            }
          }
        }
      }

      // Cache the result before returning
      this.commitFilesCache.set(commitHash, changedFiles);
      void this.saveCacheToDisk(); // Save in background
      return changedFiles;
    } catch (error) {
      console.error('[getCommitFiles] Failed:', error);
      // Cache empty result to avoid retrying failed lookups
      this.commitFilesCache.set(commitHash, []);
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

  /**
   * Check if initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

export const realGitService = new RealGitService();
