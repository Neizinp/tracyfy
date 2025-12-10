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

      // In Electron, use IPC to initialize git
      if (isElectronEnv()) {
        const shouldInit = confirm(
          'This directory is not a git repository.\n\n' +
            'Would you like to initialize it as a git repository?\n\n' +
            'This is required for version tracking.'
        );

        if (!shouldInit) {
          return false;
        }

        const rootDir = this.getRootDir();
        const result = await window.electronAPI!.git.init(rootDir);
        if (result.error) {
          console.error('[init] Git init failed:', result.error);
          return false;
        }

        this.initialized = true;
        return true;
      }

      // Browser path: ask user if they want to initialize git
      const shouldInit = confirm(
        'This directory is not a git repository.\n\n' +
          'Would you like to initialize it as a git repository?\n\n' +
          'This is required for version tracking.'
      );

      if (!shouldInit) {
        return false;
      }

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

      const artifactTypes = ['requirements', 'usecases', 'testcases', 'information', 'projects'];
      for (const type of artifactTypes) {
        try {
          const files = await fileSystemService.listFiles(type);
          for (const file of files) {
            if (file.endsWith('.md')) {
              const filePath = `${type}/${file}`;
              if (!trackedPaths.has(filePath)) {
                untrackedFiles.push({ path: filePath, status: 'new' });
              }
            }
          }
        } catch {
          // Directory might not exist yet
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
   * @param authorName - Optional author name, defaults to 'ReqTrace User'
   */
  async commitFile(filepath: string, message: string, authorName?: string): Promise<void> {
    if (!this.initialized) {
      throw new Error('Git service not initialized');
    }

    const fileExists = (await fileSystemService.readFile(filepath)) !== null;
    const cache = {};

    if (fileExists) {
      await git.add({ fs: fsAdapter, dir: this.getRootDir(), filepath, cache });
    } else {
      // File doesn't exist, assume it's a deletion
      await git.remove({ fs: fsAdapter, dir: this.getRootDir(), filepath, cache });
    }

    const authorNameToUse = authorName || 'ReqTrace User';
    const commitOid = await git.commit({
      fs: fsAdapter,
      dir: this.getRootDir(),
      message,
      author: { name: authorNameToUse, email: 'user@reqtrace.local' },
      cache,
    });

    console.log(
      `[commitFile] Successfully committed ${filepath} by ${authorNameToUse}, SHA: ${commitOid}`
    );
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

    const author = { name: 'ReqTrace User', email: 'user@reqtrace.local' };

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
