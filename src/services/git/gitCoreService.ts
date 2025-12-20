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
import type { Requirement, UseCase, TestCase, Information } from '../../types';
import {
  requirementToMarkdown,
  convertUseCaseToMarkdown,
  testCaseToMarkdown,
  informationToMarkdown,
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

    try {
      let result: FileStatus[] = [];
      let statusMatrixFiles = new Set<string>();

      // Electron path: use IPC for proper git status
      if (isElectronEnv()) {
        const status = await window.electronAPI!.git.statusMatrix(getRootDir());
        if (Array.isArray(status)) {
          const parsed = parseStatusMatrix(status);
          result = parsed.statuses;
          statusMatrixFiles = parsed.allFiles;
        }
      } else {
        // Browser path: Use git.statusMatrix directly with fsAdapter
        try {
          const status = await git.statusMatrix({ fs: fsAdapter, dir: getRootDir() });
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
    this.commitQueue = this.commitQueue.then(async () => {
      const fileExists = (await fileSystemService.readFileBinary(filepath)) !== null;
      const authorNameToUse = authorName || 'Tracyfy User';
      const author = { name: authorNameToUse, email: 'user@tracyfy.local' };

      let commitOid: string;

      if (isElectronEnv()) {
        const rootDir = getRootDir();
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
          await git.add({ fs: fsAdapter, dir: getRootDir(), filepath, cache });
        } else {
          await git.remove({ fs: fsAdapter, dir: getRootDir(), filepath, cache });
        }

        commitOid = await git.commit({
          fs: fsAdapter,
          dir: getRootDir(),
          message,
          author,
          cache,
        });
      }

      debug.log(
        `[commitFile] Successfully committed ${filepath} by ${authorNameToUse}, SHA: ${commitOid}`
      );

      // Proactively cache the file for this commit
      this.addToCacheFn(commitOid, [filepath]);

      // Dispatch event to notify UI of status change
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('git-status-changed'));
      }
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
      if (!file.endsWith('.md')) continue;
      try {
        const content = await fileSystemService.readFile(`requirements/${file}`);
        if (content) {
          const req = markdownToRequirement(content);
          if (req) requirements.push(req);
        }
      } catch (error) {
        console.error(`Failed to load requirement ${file}:`, error);
      }
    }

    // Load use cases
    const ucFiles = await fileSystemService.listFiles('usecases');
    for (const file of ucFiles) {
      if (!file.endsWith('.md')) continue;
      try {
        const content = await fileSystemService.readFile(`usecases/${file}`);
        if (content) {
          const uc = markdownToUseCase(content);
          if (uc) useCases.push(uc);
        }
      } catch (error) {
        console.error(`Failed to load use case ${file}:`, error);
      }
    }

    // Load test cases
    const tcFiles = await fileSystemService.listFiles('testcases');
    for (const file of tcFiles) {
      if (!file.endsWith('.md')) continue;
      try {
        const content = await fileSystemService.readFile(`testcases/${file}`);
        if (content) {
          const tc = markdownToTestCase(content);
          if (tc) testCases.push(tc);
        }
      } catch (error) {
        console.error(`Failed to load test case ${file}:`, error);
      }
    }

    // Load information
    const infoFiles = await fileSystemService.listFiles('information');
    for (const file of infoFiles) {
      if (!file.endsWith('.md')) continue;
      try {
        const content = await fileSystemService.readFile(`information/${file}`);
        if (content) {
          const info = markdownToInformation(content);
          if (info) information.push(info);
        }
      } catch (error) {
        console.error(`Failed to load information ${file}:`, error);
      }
    }

    return { requirements, useCases, testCases, information };
  }
}

export const gitCoreService = new GitCoreService();
