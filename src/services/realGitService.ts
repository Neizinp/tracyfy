/**
 * Real Git Service - Uses isomorphic-git with File System Access API
 *
 * This service wraps isomorphic-git to work with the real filesystem
 * via the File System Access API adapter.
 */

import git from 'isomorphic-git';
import { fileSystemService } from './fileSystemService';
import type { Requirement, UseCase, TestCase, Information } from '../types';
import {
  requirementToMarkdown,
  markdownToRequirement,
  useCaseToMarkdown,
  markdownToUseCase,
  testCaseToMarkdown,
  markdownToTestCase,
  informationToMarkdown,
  markdownToInformation,
} from '../utils/markdownUtils';

// IndexedDB storage for git internal files (since File System API can't handle .git/)
// Store as Uint8Array to preserve binary data integrity
const idbStorage = {
  async getItem(key: string): Promise<Uint8Array | null> {
    return new Promise((resolve) => {
      const request = indexedDB.open('git-storage', 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('files')) {
          db.createObjectStore('files');
        }
      };
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction('files', 'readonly');
        const store = tx.objectStore('files');
        const get = store.get(key);
        get.onsuccess = () => resolve(get.result || null);
        get.onerror = () => resolve(null);
      };
      request.onerror = () => resolve(null);
    });
  },
  async setItem(key: string, value: Uint8Array): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('git-storage', 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('files')) {
          db.createObjectStore('files');
        }
      };
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction('files', 'readwrite');
        const store = tx.objectStore('files');
        const put = store.put(value, key);
        put.onsuccess = () => resolve();
        put.onerror = () => reject(put.error);
      };
      request.onerror = () => reject(request.error);
    });
  },
  async removeItem(key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('git-storage', 1);
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction('files', 'readwrite');
        const store = tx.objectStore('files');
        const del = store.delete(key);
        del.onsuccess = () => resolve();
        del.onerror = () => reject(del.error);
      };
      request.onerror = () => reject(request.error);
    });
  },
};

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
 * File System Access API adapter for isomorphic-git
 * Adapts the File System Access API to the fs interface expected by isomorphic-git
 */
// Custom cache for isomorphic-git to store objects in IndexedDB
const gitCache = {
  async get(key: string) {
    console.log('[gitCache.get] key:', key);
    const value = await idbStorage.getItem(`.git/objects/${key}`);
    console.log('[gitCache.get] result:', value ? 'found' : 'not found');
    return value;
  },
  async set(key: string, value: Uint8Array) {
    console.log('[gitCache.set] key:', key, 'bytes:', value.length);
    await idbStorage.setItem(`.git/objects/${key}`, value);
  },
};

// Store root handle outside the class so isomorphic-git can't access it
let _rootHandle: FileSystemDirectoryHandle | null = null;

class FSAdapter {
  setRoot(handle: FileSystemDirectoryHandle) {
    _rootHandle = handle;
    fileSystemService.setDirectoryHandle(handle);
  }

  private async getHandle(
    path: string
  ): Promise<FileSystemDirectoryHandle | FileSystemFileHandle | null> {
    if (!_rootHandle) return null;

    // Normalize the path
    const normalizedPath = path.replace(/^\/+/, '').replace(/\/+$/, '');
    if (!normalizedPath) return _rootHandle;

    const parts = normalizedPath.split('/').filter((p) => p && p !== '.');
    let current: FileSystemDirectoryHandle = _rootHandle!;

    for (let i = 0; i < parts.length - 1; i++) {
      try {
        current = await current.getDirectoryHandle(parts[i]);
      } catch {
        return null;
      }
    }

    const lastName = parts[parts.length - 1];
    if (!lastName) return current;

    try {
      return await current.getFileHandle(lastName);
    } catch {
      try {
        return await current.getDirectoryHandle(lastName);
      } catch {
        return null;
      }
    }
  }

  // isomorphic-git fs interface
  promises = {
    readFile: async (
      path: string,
      options?: { encoding?: string }
    ): Promise<Uint8Array | string> => {
      const normalizedPath = path.replace(/^\//, '');

      // For .git internal files, read from IndexedDB as binary
      if (normalizedPath.startsWith('.git/')) {
        console.log('[FSAdapter.readFile] Reading from IndexedDB:', normalizedPath);
        const content = await idbStorage.getItem(normalizedPath);
        if (content === null) {
          console.log('[FSAdapter.readFile] NOT FOUND in IndexedDB:', normalizedPath);
          throw new Error(`ENOENT: no such file or directory, open '${path}'`);
        }
        console.log(
          '[FSAdapter.readFile] Found in IndexedDB:',
          normalizedPath,
          'bytes:',
          content.length
        );
        if (options?.encoding === 'utf8') {
          return new TextDecoder().decode(content);
        }
        return content;
      }

      const content = await fileSystemService.readFile(normalizedPath);
      if (content === null) {
        throw new Error(`ENOENT: no such file or directory, open '${path}'`);
      }
      if (options?.encoding === 'utf8') {
        return content;
      }
      return new TextEncoder().encode(content);
    },

    writeFile: async (path: string, data: string | Uint8Array): Promise<void> => {
      const normalizedPath = path.replace(/^\//, '');

      console.log(
        '[FSAdapter.writeFile] CALLED for:',
        normalizedPath,
        'dataType:',
        typeof data,
        'dataLength:',
        data.length
      );
      console.log('[FSAdapter.writeFile] Stack trace:', new Error().stack);

      // For .git internal files, store in IndexedDB as binary
      if (
        normalizedPath.startsWith('.git/') ||
        normalizedPath.startsWith('objects/') ||
        normalizedPath.includes('/objects/')
      ) {
        const binaryData = typeof data === 'string' ? new TextEncoder().encode(data) : data;
        const finalPath = normalizedPath.startsWith('.git/')
          ? normalizedPath
          : `.git/${normalizedPath}`;
        console.log(
          '[FSAdapter.writeFile] Storing in IndexedDB:',
          finalPath,
          'bytes:',
          binaryData.length
        );
        await idbStorage.setItem(finalPath, binaryData);
        console.log('[FSAdapter.writeFile] Stored successfully:', finalPath);
        return;
      }

      // For regular files, convert to string and write to filesystem
      const content = typeof data === 'string' ? data : new TextDecoder().decode(data);
      await fileSystemService.writeFile(normalizedPath, content);
    },

    // Alias for writeFile - isomorphic-git uses fs.write() for writing git objects
    write: async (path: string, data: string | Uint8Array): Promise<void> => {
      console.log('[FSAdapter.write] Redirecting to writeFile for:', path);
      return fsAdapter.promises.writeFile(path, data);
    },

    // Read method for binary data - isomorphic-git uses fs.read() for git objects
    read: async (path: string): Promise<Uint8Array> => {
      console.log('[FSAdapter.read] CALLED for:', path);
      return fsAdapter.promises.readFile(path) as Promise<Uint8Array>;
    },

    // Exists check - used by isomorphic-git to avoid overwriting objects
    exists: async (path: string): Promise<boolean> => {
      const normalizedPath = path.replace(/^\//, '');
      console.log('[FSAdapter.exists] Checking:', normalizedPath);

      // For .git internal files, check IndexedDB
      if (normalizedPath.startsWith('.git/')) {
        const content = await idbStorage.getItem(normalizedPath);
        const exists = content !== null;
        console.log('[FSAdapter.exists] Result:', exists);
        return exists;
      }

      // For regular files, check filesystem
      const content = await fileSystemService.readFile(normalizedPath);
      return content !== null;
    },

    unlink: async (path: string): Promise<void> => {
      const normalizedPath = path.replace(/^\//, '');
      console.log('[FSAdapter.unlink] CALLED for:', normalizedPath);

      // For .git internal files, delete from IndexedDB
      if (normalizedPath.startsWith('.git/')) {
        await idbStorage.removeItem(normalizedPath);
        return;
      }

      await fileSystemService.deleteFile(normalizedPath);
    },

    readdir: async (path: string): Promise<string[]> => {
      const normalizedPath = path.replace(/^\//, '');
      console.log('[FSAdapter.readdir] CALLED for:', normalizedPath);
      const result = await fileSystemService.listFiles(normalizedPath);
      console.log('[FSAdapter.readdir] Result:', result);
      return result;
    },

    mkdir: async (path: string): Promise<void> => {
      const normalizedPath = path.replace(/^\//, '');

      // For .git internal directories, we don't need to create them in IndexedDB
      // But we need to return success so isomorphic-git can proceed with writeFile
      if (normalizedPath.startsWith('.git/')) {
        console.log(
          '[FSAdapter.mkdir] Allowing .git directory (no-op for IndexedDB):',
          normalizedPath
        );
        return Promise.resolve();
      }

      await fileSystemService.getOrCreateDirectory(normalizedPath);
    },

    rmdir: async (_path: string): Promise<void> => {
      // Not implemented - isomorphic-git rarely needs this
    },

    stat: async (path: string) => {
      const normalizedPath = path.replace(/^\/+/, '');

      // For .git internal files, check IndexedDB first
      if (normalizedPath.startsWith('.git/')) {
        const content = await idbStorage.getItem(normalizedPath);
        if (content !== null) {
          return {
            type: 'file',
            mode: 0o100644,
            size: content.length,
            ino: 0,
            mtimeMs: Date.now(),
            ctimeMs: Date.now(),
            isFile: () => true,
            isDirectory: () => false,
            isSymbolicLink: () => false,
          };
        }

        // If not in IndexedDB, it might be a directory
        // For .git directories, just return a directory stat
        return {
          type: 'dir',
          mode: 0o40755,
          size: 0,
          ino: 0,
          mtimeMs: Date.now(),
          ctimeMs: Date.now(),
          isFile: () => false,
          isDirectory: () => true,
          isSymbolicLink: () => false,
        };
      }

      // Try to read as file first
      const fileContent = await fileSystemService.readFile(normalizedPath);
      if (fileContent !== null) {
        const size = new TextEncoder().encode(fileContent).length;
        return {
          type: 'file',
          mode: 0o100644,
          size,
          ino: 0,
          mtimeMs: Date.now(),
          ctimeMs: Date.now(),
          isFile: () => true,
          isDirectory: () => false,
          isSymbolicLink: () => false,
        };
      }

      // Check if it's a directory by trying to list it
      try {
        await fileSystemService.listFiles(normalizedPath);
        return {
          type: 'dir',
          mode: 0o40755,
          size: 0,
          ino: 0,
          mtimeMs: Date.now(),
          ctimeMs: Date.now(),
          isFile: () => false,
          isDirectory: () => true,
          isSymbolicLink: () => false,
        };
      } catch {
        throw new Error(`ENOENT: no such file or directory, stat '${path}'`);
      }
    },

    lstat: async (path: string) => {
      return this.promises.stat(path);
    },

    readlink: async (_path: string): Promise<string> => {
      throw new Error('Symlinks not supported');
    },

    symlink: async (_target: string, _path: string): Promise<void> => {
      throw new Error('Symlinks not supported');
    },

    chmod: async (_path: string, _mode: number): Promise<void> => {
      // No-op - permissions not supported
    },
  };
}

const fsAdapter = new FSAdapter();

// Debug: Check if promises is enumerable
console.log('[FSAdapter] Has promises property:', 'promises' in fsAdapter);
console.log('[FSAdapter] promises is enumerable:', Object.keys(fsAdapter).includes('promises'));
console.log('[FSAdapter] All fsAdapter keys:', Object.keys(fsAdapter));
console.log(
  '[FSAdapter] promises methods:',
  fsAdapter.promises ? Object.keys(fsAdapter.promises) : 'NONE'
);

class RealGitService {
  private initialized = false;
  private rootDir = '.';

  /**
   * Initialize git with the selected directory
   */
  async init(directoryHandle: FileSystemDirectoryHandle): Promise<boolean> {
    fsAdapter.setRoot(directoryHandle);

    // Check if .git exists
    const hasGit = await fileSystemService.checkGitExists();

    if (!hasGit) {
      // Ask user if they want to initialize git
      const shouldInit = confirm(
        'This directory is not a git repository.\n\n' +
          'Would you like to initialize it as a git repository?\n\n' +
          'This is required for version tracking.'
      );

      if (!shouldInit) {
        return false;
      }

      // Initialize git repository
      console.log('[init] Initializing git repository...');
      await git.init({
        fs: fsAdapter,
        dir: this.rootDir,
        defaultBranch: 'main',
        cache: gitCache,
      });
      console.log('[init] Git repository initialized');

      // Create initial commit
      try {
        console.log('[init] Creating initial commit...');
        await fileSystemService.writeFile(
          'README.md',
          '# Requirements Management\n\nThis repository contains requirements, use cases, test cases, and information managed by ReqTrace.\n'
        );
        console.log('[init] README.md written');

        await git.add({
          fs: fsAdapter,
          dir: this.rootDir,
          filepath: 'README.md',
          cache: gitCache,
        });
        console.log('[init] README.md added to git');

        await git.commit({
          fs: fsAdapter,
          dir: this.rootDir,
          message: 'Initial commit',
          author: {
            name: 'ReqTrace User',
            email: 'user@reqtrace.local',
          },
          cache: gitCache,
        });

        console.log('[init] Initial commit created successfully');
      } catch (error) {
        console.error('[init] Failed to create initial commit:', error);
        // Don't throw - allow app to continue, we'll create initial commit later if needed
      }
    }

    this.initialized = true;
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
        markdown = useCaseToMarkdown(artifact as UseCase);
        break;
      case 'testcases':
        markdown = testCaseToMarkdown(artifact as TestCase);
        break;
      case 'information':
        markdown = informationToMarkdown(artifact as Information);
        break;
    }

    const filePath = `${type}/${id}.md`;

    // Write file to disk
    await fileSystemService.writeFile(filePath, markdown);
    // Note: We don't stage in git here because git.add() fails with File System API
    // Pending changes are tracked separately in FileSystemProvider
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
      // Delete the file only
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

      // Try to use git.statusMatrix, but if it fails (missing objects), fall back to filesystem scan
      try {
        const status = await git.statusMatrix({
          fs: fsAdapter,
          dir: this.rootDir,
          cache: gitCache,
        });

        console.log('[getStatus] Raw statusMatrix:', status);

        result = status
          .map(([filepath, head, workdir, stage]) => {
            let statusStr = 'unchanged';
            if (head === 1 && workdir === 2 && stage === 2) statusStr = 'modified';
            if (head === 0 && workdir === 2 && stage === 0) statusStr = 'new'; // Untracked
            if (head === 0 && workdir === 2 && stage === 2) statusStr = 'added'; // Staged new
            if (head === 1 && workdir === 0) statusStr = 'deleted';

            return {
              path: filepath,
              status: statusStr,
            };
          })
          .filter((f) => f.status !== 'unchanged');
      } catch (statusError) {
        console.warn(
          '[getStatus] statusMatrix failed, falling back to filesystem scan:',
          statusError
        );
        // If git operations fail, we'll just scan the filesystem below
      }

      // Also check for untracked files by reading filesystem directly
      // since statusMatrix doesn't reliably detect them
      const trackedPaths = new Set(result.map((f) => f.path));
      const untrackedFiles: FileStatus[] = [];

      const artifactTypes = ['requirements', 'usecases', 'testcases', 'information'];
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
        } catch (error) {
          // Directory might not exist yet
        }
      }

      const allFiles = [...result, ...untrackedFiles];
      console.log('[getStatus] Filtered result with untracked:', allFiles);
      return allFiles;
    } catch (error) {
      console.error('Failed to get status:', error);
      return [];
    }
  }

  /**
   * Commit a single file (Atomic Commit)
   */
  async commitFile(filepath: string, message: string): Promise<void> {
    if (!this.initialized) {
      throw new Error('Git service not initialized');
    }

    try {
      // First, ensure git repository is initialized
      const hasGit = await fileSystemService.checkGitExists();
      console.log('[commitFile] Git exists on disk:', hasGit);

      // Check if HEAD exists in IndexedDB (not just .git folder on disk)
      let headInIDB = false;
      try {
        const headContent = await idbStorage.getItem('.git/HEAD');
        headInIDB = headContent !== null;
        console.log('[commitFile] HEAD in IndexedDB:', headInIDB, 'content:', headContent);
      } catch (error) {
        console.log('[commitFile] HEAD check error:', error);
        headInIDB = false;
      }

      if (!headInIDB) {
        console.log('[commitFile] Re-initializing git to write to IndexedDB...');
        await git.init({
          fs: fsAdapter,
          dir: this.rootDir,
          defaultBranch: 'main',
          cache: gitCache,
        });
        console.log('[commitFile] Git re-initialized');

        // Manually verify and create HEAD if needed
        const headCheck = await idbStorage.getItem('.git/HEAD');
        console.log('[commitFile] HEAD after re-init:', headCheck);
        if (!headCheck) {
          console.log('[commitFile] Manually creating HEAD...');
          const headContent = 'ref: refs/heads/main\n';
          await idbStorage.setItem('.git/HEAD', new TextEncoder().encode(headContent));
          console.log('[commitFile] HEAD manually created');
        }

        // Also ensure config exists
        const configCheck = await idbStorage.getItem('.git/config');
        if (!configCheck) {
          console.log('[commitFile] Manually creating config...');
          const configContent =
            '[core]\n\trepositoryformatversion = 0\n\tfilemode = false\n\tbare = false\n\tlogallrefupdates = true\n';
          await idbStorage.setItem('.git/config', new TextEncoder().encode(configContent));
          console.log('[commitFile] config manually created');
        }
      }

      // Check if HEAD exists (repository has at least one commit)
      let hasHead = false;
      try {
        const headRef = await git.resolveRef({
          fs: fsAdapter,
          dir: this.rootDir,
          ref: 'HEAD',
          cache: gitCache,
        });
        console.log('[commitFile] HEAD found:', headRef);
        hasHead = true;
      } catch (error) {
        console.log('[commitFile] No HEAD found, error:', error);
      }

      if (!hasHead) {
        // No HEAD means no initial commit - create one first
        console.log('[commitFile] Creating initial commit...');

        await fileSystemService.writeFile('.gitkeep', 'Initial commit placeholder\n');
        console.log('[commitFile] .gitkeep written');

        await git.add({
          fs: fsAdapter,
          dir: this.rootDir,
          filepath: '.gitkeep',
          cache: gitCache,
        });
        console.log('[commitFile] .gitkeep added');

        const initialCommitSha = await git.commit({
          fs: fsAdapter,
          dir: this.rootDir,
          message: 'Initial commit',
          author: {
            name: 'ReqTrace User',
            email: 'user@reqtrace.local',
          },
          cache: gitCache,
        });
        console.log('[commitFile] Initial commit created with SHA:', initialCommitSha);

        // Verify HEAD was created
        try {
          const verifyRef = await git.resolveRef({
            fs: fsAdapter,
            dir: this.rootDir,
            ref: 'HEAD',
            cache: gitCache,
          });
          console.log('[commitFile] HEAD verified after initial commit:', verifyRef);
        } catch (verifyError) {
          console.error(
            '[commitFile] CRITICAL: HEAD still not found after initial commit!',
            verifyError
          );
          throw new Error('Failed to create initial commit - HEAD still not found');
        }
      }

      // Check if file exists (for add/modify) or not (for delete)
      const fileExists = (await fileSystemService.readFile(filepath)) !== null;

      if (fileExists) {
        await git.add({
          fs: fsAdapter,
          dir: this.rootDir,
          filepath,
          cache: gitCache,
        });
      } else {
        await git.remove({
          fs: fsAdapter,
          dir: this.rootDir,
          filepath,
          cache: gitCache,
        });
      }

      await git.commit({
        fs: fsAdapter,
        dir: this.rootDir,
        message,
        author: {
          name: 'ReqTrace User',
          email: 'user@reqtrace.local',
        },
        cache: gitCache,
      });

      console.log(`[commitFile] Successfully committed ${filepath}`);
    } catch (error) {
      console.error('[commitFile] Error:', error);
      throw error;
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
   * Get git log for a specific file or all files
   */
  async getHistory(filepath?: string): Promise<CommitInfo[]> {
    if (!this.initialized) {
      return [];
    }

    try {
      const commits = await git.log({
        fs: fsAdapter,
        dir: this.rootDir,
        depth: 100,
        filepath,
      });

      return commits.map((commit) => ({
        hash: commit.oid,
        message: commit.commit.message,
        author: commit.commit.author.name,
        timestamp: commit.commit.author.timestamp * 1000,
      }));
    } catch (error) {
      console.error('Failed to get git history:', error);
      return [];
    }
  }

  /**
   * Create a git tag (baseline)
   */
  /**
   * Create a git tag (baseline)
   */
  async createTag(tagName: string, message: string): Promise<void> {
    if (!this.initialized) {
      throw new Error('Git service not initialized');
    }

    await git.annotatedTag({
      fs: fsAdapter,
      dir: this.rootDir,
      ref: tagName,
      message: message,
      tagger: {
        name: 'ReqTrace User',
        email: 'user@reqtrace.local',
      },
    });
  }

  /**
   * List all tags
   */
  async listTags(): Promise<string[]> {
    if (!this.initialized) {
      return [];
    }

    try {
      return await git.listTags({
        fs: fsAdapter,
        dir: this.rootDir,
      });
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
      const tagNames = await this.listTags();
      const tags = [];

      for (const name of tagNames) {
        try {
          // Try to resolve as annotated tag first
          const oid = await git.resolveRef({ fs: fsAdapter, dir: this.rootDir, ref: name });
          const read = await git.readTag({ fs: fsAdapter, dir: this.rootDir, oid });

          tags.push({
            name,
            message: read.tag.message,
            timestamp: read.tag.tagger.timestamp * 1000,
            commit: read.tag.object,
          });
        } catch (e) {
          // Fallback for lightweight tags or if readTag fails
          // For lightweight tags, we'd need to read the commit it points to
          try {
            const oid = await git.resolveRef({ fs: fsAdapter, dir: this.rootDir, ref: name });
            const commit = await git.readCommit({ fs: fsAdapter, dir: this.rootDir, oid });
            tags.push({
              name,
              message: commit.commit.message, // Use commit message as fallback
              timestamp: commit.commit.author.timestamp * 1000,
              commit: oid,
            });
          } catch (e2) {
            console.warn(`Failed to read tag ${name}:`, e2);
          }
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
