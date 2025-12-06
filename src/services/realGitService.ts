/**
 * Real Git Service - Uses isomorphic-git with File System Access API or Electron IPC
 *
 * In Electron, routes git operations through IPC to the main process (which uses Node fs).
 * In browsers, uses an adapter over the File System Access API.
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

// Type for electron API
declare global {
  interface Window {
    electronAPI?: {
      isElectron: boolean;
      git: {
        status: (dir: string, filepath: string) => Promise<string>;
        statusMatrix: (dir: string) => Promise<any[]>;
        add: (dir: string, filepath: string) => Promise<{ ok?: boolean; error?: string }>;
        remove: (dir: string, filepath: string) => Promise<{ ok?: boolean; error?: string }>;
        commit: (
          dir: string,
          message: string,
          author?: any
        ) => Promise<{ oid?: string; error?: string }>;
        log: (dir: string, depth?: number, filepath?: string) => Promise<any>;
        listFiles: (dir: string) => Promise<string[]>;
        resolveRef: (dir: string, ref: string) => Promise<string>;
        init: (dir: string) => Promise<{ ok?: boolean; error?: string }>;
        annotatedTag: (
          dir: string,
          ref: string,
          message: string,
          tagger?: any
        ) => Promise<{ ok?: boolean; error?: string }>;
        listTags: (dir: string) => Promise<string[]>;
        readTag: (dir: string, oid: string) => Promise<any>;
      };
    };
  }
}

const isElectronEnv = () => typeof window !== 'undefined' && !!window.electronAPI?.isElectron;
const requireElectron = () => {
  if (!isElectronEnv()) {
    throw new Error(
      'Git operations require the Electron app. Run `npm run electron:dev` or `npm run electron:start`.'
    );
  }
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
// Removed gitCache - not used anymore as we write objects directly to filesystem

class FSAdapter {
  private fdCounter = 3; // 0,1,2 reserved
  private openFiles = new Map<number, { path: string; position: number; flags: string }>();

  setRoot(handle: FileSystemDirectoryHandle) {
    fileSystemService.setDirectoryHandle(handle);
  }

  // isomorphic-git fs interface
  promises = {
    open: async (path: string, flags: string) => {
      const normalizedPath = path.replace(/^\/+/, '');
      // Ensure parent directories exist for write modes
      if (
        flags.includes('w') ||
        flags.includes('a') ||
        flags.includes('+') ||
        flags.includes('x')
      ) {
        const parts = normalizedPath.split('/');
        parts.pop();
        const dirPath = parts.join('/');
        if (dirPath) {
          await fileSystemService.getOrCreateDirectory(dirPath);
        }
      }

      const fd = this.fdCounter++;
      this.openFiles.set(fd, { path: normalizedPath, position: 0, flags });
      return fd;
    },

    close: async (fd: number) => {
      this.openFiles.delete(fd);
    },

    readFile: async (
      path: string,
      options?: { encoding?: string }
    ): Promise<Uint8Array | string> => {
      const normalizedPath = path.replace(/^\//, '');

      // For .git internal files, read from filesystem only
      if (normalizedPath.startsWith('.git/')) {
        console.log('[FSAdapter.readFile] Reading .git file from disk:', normalizedPath);

        const fsBinaryContent = await fileSystemService.readFileBinary(normalizedPath);
        if (fsBinaryContent !== null) {
          console.log(
            '[FSAdapter.readFile] Found:',
            normalizedPath,
            'bytes:',
            fsBinaryContent.length
          );
          if (options?.encoding === 'utf8') {
            return new TextDecoder().decode(fsBinaryContent);
          }
          return fsBinaryContent;
        }

        console.log('[FSAdapter.readFile] NOT FOUND:', normalizedPath);
        throw new Error(`ENOENT: no such file or directory, open '${path}'`);
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

      // Special logging for objects
      if (normalizedPath.includes('/objects/')) {
        console.log('[FSAdapter.writeFile] *** GIT OBJECT WRITE ***:', normalizedPath);
        console.log('[FSAdapter.writeFile] Object data length:', data.length);
        console.log('[FSAdapter.writeFile] Stack:', new Error().stack);
      }

      console.log(
        '[FSAdapter.writeFile] CALLED for:',
        normalizedPath,
        'dataType:',
        typeof data,
        'dataLength:',
        data.length
      );

      // Write ALL files (including .git internals) directly to filesystem
      // No IndexedDB caching - causes git objects to not persist
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
          '[FSAdapter.writeFile] Writing .git file to disk:',
          finalPath,
          'bytes:',
          binaryData.length
        );
        await fileSystemService.writeFileBinary(finalPath, binaryData);
        console.log('[FSAdapter.writeFile] Wrote successfully:', finalPath);
        return;
      }

      // For regular files, convert to string and write to filesystem
      const content = typeof data === 'string' ? data : new TextDecoder().decode(data);
      await fileSystemService.writeFile(normalizedPath, content);
    },

    // Node-style write(fd, buffer, offset, length, position?)
    write: async (
      fdOrPath: number | string,
      buffer: Uint8Array,
      offset?: number,
      length?: number,
      position?: number | null
    ): Promise<{ bytesWritten: number }> => {
      // Handle path writes by redirecting to writeFile for compatibility
      if (typeof fdOrPath === 'string') {
        await fsAdapter.promises.writeFile(fdOrPath, buffer);
        return { bytesWritten: buffer.length };
      }

      const fd = fdOrPath;
      const open = this.openFiles.get(fd);
      if (!open) throw new Error(`Bad file descriptor: ${fd}`);

      console.log('[FSAdapter.write(fd)]', {
        path: open.path,
        flags: open.flags,
        offset,
        length,
        position,
        bufferLength: buffer.length,
      });

      const start = offset ?? 0;
      const end = length !== undefined ? start + length : buffer.byteLength;
      const slice = buffer.subarray(start, end);

      const normalizedPath = open.path;
      // For append, move position to end
      if (open.flags.includes('a')) {
        const existing = await fileSystemService.readFileBinary(normalizedPath);
        const merged = new Uint8Array((existing?.length || 0) + slice.length);
        if (existing) merged.set(existing, 0);
        merged.set(slice, existing?.length || 0);
        await fsAdapter.promises.writeFile(normalizedPath, merged);
        open.position = merged.length;
        return { bytesWritten: slice.length };
      }

      // Position null means append to current position
      const pos = position == null ? open.position : position;
      if (pos !== 0) {
        const existing =
          (await fileSystemService.readFileBinary(normalizedPath)) || new Uint8Array();
        const needed = Math.max(existing.length, pos + slice.length);
        const merged = new Uint8Array(needed);
        merged.set(existing, 0);
        merged.set(slice, pos);
        await fsAdapter.promises.writeFile(normalizedPath, merged);
        open.position = pos + slice.length;
        return { bytesWritten: slice.length };
      }

      await fsAdapter.promises.writeFile(normalizedPath, slice);
      open.position = slice.length;
      return { bytesWritten: slice.length };
    },

    // Node-style read(fd, buffer, offset, length, position?) or path alias
    read: async (
      fdOrPath: number | string,
      buffer?: Uint8Array,
      offset?: number,
      length?: number,
      position?: number | null
    ): Promise<{ bytesRead: number; buffer: Uint8Array }> => {
      if (typeof fdOrPath === 'string') {
        const data = (await fsAdapter.promises.readFile(fdOrPath)) as Uint8Array;
        const slice = data.subarray(0, length ?? data.length);
        if (buffer) {
          const start = offset ?? 0;
          buffer.set(slice, start);
          return { bytesRead: slice.length, buffer };
        }
        return { bytesRead: slice.length, buffer: slice };
      }

      const fd = fdOrPath;
      const open = this.openFiles.get(fd);
      if (!open) throw new Error(`Bad file descriptor: ${fd}`);

      console.log('[FSAdapter.read(fd)]', {
        path: open.path,
        flags: open.flags,
        offset,
        length,
        position,
      });

      const data = (await fileSystemService.readFileBinary(open.path)) || new Uint8Array();
      const startPos = position ?? open.position;
      const slice = data.subarray(startPos, startPos + (length ?? data.length));

      if (buffer) {
        const destStart = offset ?? 0;
        buffer.set(slice, destStart);
        open.position = startPos + slice.length;
        return { bytesRead: slice.length, buffer };
      }

      open.position = startPos + slice.length;
      return { bytesRead: slice.length, buffer: slice };
    },

    // Exists check - used by isomorphic-git to avoid overwriting objects
    exists: async (path: string): Promise<boolean> => {
      const normalizedPath = path.replace(/^\//, '');

      console.log('[FSAdapter.exists] Checking:', normalizedPath);
      console.log(
        '[FSAdapter.exists] Stack:',
        new Error().stack?.split('\n').slice(0, 5).join('\n')
      );

      // For .git internal files, check filesystem only
      if (normalizedPath.startsWith('.git/')) {
        try {
          const fsContent = await fileSystemService.readFileBinary(normalizedPath);
          const exists = fsContent !== null;
          console.log('[FSAdapter.exists] Result for', normalizedPath, ':', exists);
          return exists;
        } catch {
          console.log('[FSAdapter.exists] Result for', normalizedPath, ': false');
          return false;
        }
      }

      // For regular files, check filesystem
      const content = await fileSystemService.readFile(normalizedPath);
      const exists = content !== null;
      console.log('[FSAdapter.exists] Result for', normalizedPath, ':', exists);
      return exists;
    },

    unlink: async (path: string): Promise<void> => {
      const normalizedPath = path.replace(/^\//, '');
      console.log('[FSAdapter.unlink] CALLED for:', normalizedPath);

      // Delete from filesystem
      await fileSystemService.deleteFile(normalizedPath);
    },

    readdir: async (path: string): Promise<string[]> => {
      const normalizedPath = path.replace(/^\//, '').replace(/\/$/, '');
      console.log('[FSAdapter.readdir] CALLED for:', normalizedPath);

      // For .git internal directories, check filesystem only
      if (normalizedPath.startsWith('.git') || normalizedPath === '.git') {
        try {
          const result = await fileSystemService.listEntries(normalizedPath);
          console.log('[FSAdapter.readdir] Result for', normalizedPath, ':', result);
          return result;
        } catch {
          console.log('[FSAdapter.readdir] Directory not found:', normalizedPath);
          return [];
        }
      }

      const result = await fileSystemService.listFiles(normalizedPath);
      console.log('[FSAdapter.readdir] Result:', result);
      return result;
    },

    mkdir: async (path: string): Promise<void> => {
      const normalizedPath = path.replace(/^\//, '');

      console.log('[FSAdapter.mkdir] Creating directory:', normalizedPath);
      console.log('[FSAdapter.mkdir] Stack:', new Error().stack);

      // For ALL directories (including .git), create them on filesystem
      await fileSystemService.getOrCreateDirectory(normalizedPath);
      console.log('[FSAdapter.mkdir] Created:', normalizedPath);
    },

    rmdir: async (_path: string): Promise<void> => {
      // Not implemented - isomorphic-git rarely needs this
    },

    stat: async (path: string) => {
      const normalizedPath = path.replace(/^\/+/, '');

      // For .git internal files, check filesystem only
      if (normalizedPath.startsWith('.git/') || normalizedPath === '.git') {
        // Try to read as file
        const fsContent = await fileSystemService.readFile(normalizedPath);
        if (fsContent !== null) {
          const size = new TextEncoder().encode(fsContent).length;
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

        // Check if it's a directory on filesystem
        try {
          const files = await fileSystemService.listFiles(normalizedPath);
          if (files.length >= 0) {
            // listFiles returns [] for empty dirs
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
        } catch {
          // Not a directory
        }

        throw new Error(`ENOENT: no such file or directory, stat '${path}'`);
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

    lstat: function (path: string) {
      // lstat is the same as stat for us (no symlinks)
      return this.stat(path);
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
      } as any);
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
        } as any);
        console.log('[init] README.md added to git');

        await git.commit({
          fs: fsAdapter,
          dir: this.rootDir,
          message: 'Initial commit',
          author: {
            name: 'ReqTrace User',
            email: 'user@reqtrace.local',
          },
        });

        console.log('[init] Initial commit created successfully');
      } catch (error) {
        console.error('[init] Failed to create initial commit:', error);
        // Don't throw - allow app to continue, we'll create initial commit later if needed
      }
    }

    this.initialized = true;

    // Ensure essential git files exist (for both new and existing repos)
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
        console.log('[init] Creating missing git file:', file.path);
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

    requireElectron();

    try {
      let result: FileStatus[] = [];

      const status = await window.electronAPI!.git.statusMatrix(this.rootDir);

      console.log('[getStatus] Raw statusMatrix:', status);

      if (Array.isArray(status)) {
        result = status
          .map(([filepath, head, workdir, stage]) => {
            let statusStr = 'unchanged';
            if (head === 1 && workdir === 2 && stage === 2) statusStr = 'modified';
            if (head === 0 && workdir === 2 && stage === 0) statusStr = 'new';
            if (head === 0 && workdir === 2 && stage === 2) statusStr = 'added';
            if (head === 1 && workdir === 0) statusStr = 'deleted';

            return {
              path: filepath,
              status: statusStr,
            };
          })
          .filter((f) => f.status !== 'unchanged');
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
      // Stage file (guard for missing file)
      const fileExists = (await fileSystemService.readFile(filepath)) !== null;
      if (!fileExists) {
        throw new Error(`File not found on disk: ${filepath}`);
      }

      await git.add({ fs: fsAdapter, dir: this.rootDir, filepath });

      const commitOid = await git.commit({
        fs: fsAdapter,
        dir: this.rootDir,
        message,
        author: { name: 'ReqTrace User', email: 'user@reqtrace.local' },
      });

      console.log('[commitFile] Commit SHA (fsAdapter):', commitOid);
      console.log(`[commitFile] Successfully committed ${filepath}`);
    } catch (error) {
      console.error('[commitFile] Commit error:', error);
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

    requireElectron();

    try {
      const commits = await window.electronAPI!.git.log(this.rootDir, 100, filepath);

      return Array.isArray(commits)
        ? commits.map((commit) => ({
            hash: commit.oid,
            message: commit.message,
            author: commit.author,
            timestamp: commit.timestamp,
          }))
        : [];
    } catch (error) {
      console.error('Failed to get git history:', error);
      return [];
    }
  }

  /**
   * Create a git tag (baseline)
   */
  async createTag(tagName: string, message: string): Promise<void> {
    if (!this.initialized) {
      throw new Error('Git service not initialized');
    }

    requireElectron();

    const result = await window.electronAPI!.git.annotatedTag(this.rootDir, tagName, message, {
      name: 'ReqTrace User',
      email: 'user@reqtrace.local',
    });
    if (result.error) throw new Error(result.error);
  }

  /**
   * List all tags
   */
  async listTags(): Promise<string[]> {
    if (!this.initialized) {
      return [];
    }

    requireElectron();

    try {
      return await window.electronAPI!.git.listTags(this.rootDir);
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
      requireElectron();

      const tagNames = await window.electronAPI!.git.listTags(this.rootDir);
      const tags = [];

      for (const name of tagNames) {
        try {
          // Try to resolve as annotated tag first
          const oid = await window.electronAPI!.git.resolveRef(this.rootDir, name);
          const read = await window.electronAPI!.git.readTag(this.rootDir, oid);

          tags.push({
            name,
            message: read.message,
            timestamp: read.timestamp,
            commit: read.object,
          });
        } catch (e) {
          // Fallback for lightweight tags or if readTag fails
          // For lightweight tags, we'd need to read the commit it points to
          try {
            const oid = await window.electronAPI!.git.resolveRef(this.rootDir, name);
            const logResult = await window.electronAPI!.git.log(this.rootDir, 1);
            const commit = Array.isArray(logResult) ? logResult[0] : undefined;
            if (commit) {
              tags.push({
                name,
                message: commit.message,
                timestamp: commit.timestamp,
                commit: oid,
              });
            }
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
