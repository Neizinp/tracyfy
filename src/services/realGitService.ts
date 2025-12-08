// ...existing code...
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
      console.log('[FSAdapter.open] path:', normalizedPath, 'flags:', flags);

      // Special log for object files
      if (normalizedPath.includes('objects')) {
        console.log('[FSAdapter.open] *** OPENING OBJECT FILE ***:', normalizedPath);
      }

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
          console.log('[FSAdapter.open] Creating parent dir:', dirPath);
          await fileSystemService.getOrCreateDirectory(dirPath);
        }
      }

      const fd = this.fdCounter++;
      this.openFiles.set(fd, { path: normalizedPath, position: 0, flags });
      console.log('[FSAdapter.open] Assigned fd:', fd);
      return fd;
    },

    close: async (fd: number) => {
      this.openFiles.delete(fd);
    },

    readFile: async (
      path: string,
      options?: { encoding?: string }
    ): Promise<Uint8Array | string> => {
      // Normalize path: remove leading / and ./ prefixes
      const normalizedPath = path.replace(/^\//, '').replace(/^\.\//, '');

      console.log(
        '[FSAdapter.readFile] ENTRY path:',
        path,
        'normalized:',
        normalizedPath,
        'options:',
        options
      );

      // Helper to create proper ENOENT error with code property
      const createENOENT = (filePath: string): Error => {
        const err: Error & { code?: string } = new Error(
          `ENOENT: no such file or directory, open '${filePath}'`
        );
        err.code = 'ENOENT';
        return err;
      };

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

        console.log('[FSAdapter.readFile] NOT FOUND (throwing ENOENT):', normalizedPath);
        throw createENOENT(path);
      }

      // For working directory files, always return binary (Uint8Array)
      // This is critical for isomorphic-git's GitWalkerFs.content() which expects bytes
      console.log('[FSAdapter.readFile] Reading working dir file:', normalizedPath);

      const binaryContent = await fileSystemService.readFileBinary(normalizedPath);
      if (binaryContent !== null) {
        console.log(
          '[FSAdapter.readFile] Found (binary):',
          normalizedPath,
          'bytes:',
          binaryContent.length
        );
        if (options?.encoding === 'utf8') {
          return new TextDecoder().decode(binaryContent);
        }
        return binaryContent;
      }

      // File not found - MUST throw ENOENT, never return null
      console.log('[FSAdapter.readFile] NOT FOUND (throwing ENOENT):', normalizedPath);
      throw createENOENT(path);
    },

    writeFile: async (path: string, data: string | Uint8Array): Promise<void> => {
      // Normalize path: remove leading / and ./ prefixes
      const normalizedPath = path.replace(/^\//, '').replace(/^\.\//, '');

      // Log ALL writes to see what isomorphic-git is doing
      console.log(
        '[FSAdapter.writeFile] CALLED for:',
        normalizedPath,
        'dataType:',
        typeof data,
        'dataLength:',
        data.length
      );
      console.log('[FSAdapter.writeFile] Stack trace:', new Error().stack);

      // Special logging for objects
      if (normalizedPath.includes('objects')) {
        console.log('[FSAdapter.writeFile] *** GIT OBJECT WRITE ***:', normalizedPath);
        console.log('[FSAdapter.writeFile] Object data length:', data.length);
      }

      try {
        // Write ALL files (including .git internals) directly to filesystem
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
      } catch (err) {
        console.error('[FSAdapter.writeFile] ERROR writing:', normalizedPath, err);
        throw err;
      }
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
      // Normalize path: remove leading / and ./ prefixes
      const normalizedPath = path.replace(/^\//, '').replace(/^\.\//, '');

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
      // Normalize path: remove leading / and ./ prefixes
      const normalizedPath = path.replace(/^\//, '').replace(/^\.\//, '');
      console.log('[FSAdapter.unlink] CALLED for:', normalizedPath);

      // Delete from filesystem
      await fileSystemService.deleteFile(normalizedPath);
    },

    readdir: async (path: string): Promise<string[]> => {
      // Normalize path - handle ./ prefix and trailing slashes
      let normalizedPath = path.replace(/^\//, '').replace(/\/$/, '').replace(/^\.\//, '');
      if (normalizedPath === '.') normalizedPath = '';

      console.log('[FSAdapter.readdir] CALLED for:', normalizedPath || '(root)');

      // Filter out temporary/swap files that can cause race conditions
      const filterTempFiles = (entries: string[]): string[] => {
        return entries.filter((entry) => {
          // Filter out swap files and other temporary files
          if (entry.endsWith('.crswap')) return false;
          if (entry.endsWith('.swp')) return false;
          if (entry.endsWith('.tmp')) return false;
          if (entry.endsWith('~')) return false;
          if (entry.startsWith('.#')) return false;
          return true;
        });
      };

      // For .git internal directories, check filesystem only
      if (normalizedPath.startsWith('.git') || normalizedPath === '.git') {
        try {
          const result = await fileSystemService.listEntries(normalizedPath);
          console.log('[FSAdapter.readdir] Result for', normalizedPath, ':', result);
          return result; // Don't filter .git internal files
        } catch {
          console.log('[FSAdapter.readdir] Directory not found:', normalizedPath);
          return [];
        }
      }

      // For root or other directories, list ALL entries (files and directories)
      try {
        const result = await fileSystemService.listEntries(normalizedPath || '.');
        const filtered = filterTempFiles(result);
        console.log('[FSAdapter.readdir] Result:', filtered);
        return filtered;
      } catch (e) {
        console.log('[FSAdapter.readdir] Error listing:', normalizedPath, e);
        return [];
      }
    },

    mkdir: async (path: string, _options?: { recursive?: boolean }): Promise<void> => {
      // Normalize path: remove leading / and ./ prefixes
      const normalizedPath = path.replace(/^\//, '').replace(/^\.\//, '');

      console.log('[FSAdapter.mkdir] Creating directory:', normalizedPath);

      // For ALL directories (including .git), create them on filesystem
      // Note: getOrCreateDirectory already creates parent dirs recursively
      await fileSystemService.getOrCreateDirectory(normalizedPath);
      console.log('[FSAdapter.mkdir] Created:', normalizedPath);
    },

    rmdir: async (_path: string): Promise<void> => {
      // Not implemented - isomorphic-git rarely needs this
    },

    stat: async (path: string) => {
      // Normalize path - remove leading slashes and handle . and ./
      const normalizedPath = path.replace(/^\/+/, '').replace(/^\.\//, '');

      // Handle root directory special case
      if (normalizedPath === '' || normalizedPath === '.') {
        console.log('[FSAdapter.stat] Root directory, returning dir stat');
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

      // Log all stat calls to debug object existence checks
      console.log('[FSAdapter.stat] Called for:', normalizedPath);

      // For .git internal files, check filesystem only
      if (normalizedPath.startsWith('.git/') || normalizedPath === '.git') {
        // Try to read as file first (use binary for .git files)
        const fsContent = await fileSystemService.readFileBinary(normalizedPath);
        if (fsContent !== null) {
          console.log('[FSAdapter.stat] Found file:', normalizedPath, 'bytes:', fsContent.length);
          return {
            type: 'file',
            mode: 0o100644,
            size: fsContent.length,
            ino: 0,
            mtimeMs: Date.now(),
            ctimeMs: Date.now(),
            isFile: () => true,
            isDirectory: () => false,
            isSymbolicLink: () => false,
          };
        }

        // Check if it's a directory on filesystem (WITHOUT creating it!)
        const dirExists = await fileSystemService.directoryExists(normalizedPath);
        if (dirExists) {
          console.log('[FSAdapter.stat] Found directory:', normalizedPath);
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

        // Throw error with .code property for isomorphic-git
        console.log('[FSAdapter.stat] NOT FOUND:', normalizedPath);
        const err = new Error(`ENOENT: no such file or directory, stat '${path}'`);
        (err as NodeJS.ErrnoException).code = 'ENOENT';
        throw err;
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

      // Check if it's a directory (WITHOUT creating it!)
      const dirExists = await fileSystemService.directoryExists(normalizedPath);
      if (dirExists) {
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

      // Throw error with .code property for isomorphic-git
      const err = new Error(`ENOENT: no such file or directory, stat '${path}'`);
      (err as NodeJS.ErrnoException).code = 'ENOENT';
      throw err;
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

  // isomorphic-git also calls these directly on fs (not fs.promises) for object storage
  exists = async (path: string): Promise<boolean> => {
    return this.promises.exists(path);
  };

  write = async (path: string, data: Uint8Array): Promise<void> => {
    console.log('[FSAdapter.write] DIRECT CALL for:', path, 'bytes:', data.length);
    // This is the method isomorphic-git uses for writing git objects!
    await this.promises.writeFile(path, data);
  };
}

const fsAdapter = new FSAdapter();

// Debug: Check if promises is enumerable (isomorphic-git requires this)
console.log('[FSAdapter] Has promises property:', 'promises' in fsAdapter);
const promisesDescriptor = Object.getOwnPropertyDescriptor(fsAdapter, 'promises');
console.log('[FSAdapter] promises descriptor:', promisesDescriptor);
console.log('[FSAdapter] promises.enumerable:', promisesDescriptor?.enumerable);
console.log('[FSAdapter] All fsAdapter keys:', Object.keys(fsAdapter));
console.log(
  '[FSAdapter] promises methods:',
  fsAdapter.promises ? Object.keys(fsAdapter.promises) : 'NONE'
);

class RealGitService {
  /**
   * Read a file at a specific commit (by SHA)
   */
  async readFileAtCommit(filepath: string, commitSha: string): Promise<string | null> {
    if (!this.initialized) {
      throw new Error('Git service not initialized');
    }
    try {
      const result = await git.readBlob({
        fs: fsAdapter,
        dir: this.getRootDir(),
        oid: commitSha,
        filepath,
      });
      if (!result || !result.object) {
        console.warn(
          '[readFileAtCommit] No blob found for',
          filepath,
          'at',
          commitSha,
          'result:',
          result
        );
        return null;
      }
      const { object } = result;
      // Defensive: check if object is Uint8Array
      if (!(object instanceof Uint8Array)) {
        console.error(
          '[readFileAtCommit] Blob object is not Uint8Array for',
          filepath,
          'at',
          commitSha,
          'object:',
          object
        );
        return null;
      }
      const decoded = new TextDecoder().decode(object);
      console.log(
        '[readFileAtCommit] Decoded file',
        filepath,
        'at',
        commitSha,
        'object.length:',
        object?.length,
        'decoded.length:',
        decoded.length,
        'preview:',
        decoded.slice(0, 80)
      );
      return decoded;
    } catch (err: any) {
      // Suppress stack trace for expected missing files
      if (
        err &&
        (err.code === 'NotFoundError' ||
          (typeof err.message === 'string' &&
            err.message.includes('Could not find file or directory')))
      ) {
        // Optionally, log a concise info message
        console.info(`[readFileAtCommit] File not found: ${filepath} at ${commitSha}`);
        return null;
      }
      // Unexpected error: log full error
      console.error('[readFileAtCommit] Unexpected error reading', filepath, 'at', commitSha, err);
      return null;
    }
  }
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
   * In Electron, directoryHandle is ignored (we use rootPath from fileSystemService)
   * In browser, directoryHandle is the FSA handle
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
        console.log('[init] Existing .git folder found, HEAD exists:', hasValidRepo);
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
          console.log('[init] Recreated HEAD -> refs/heads/main');
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
        console.log('[init] Initializing git repository via IPC at:', rootDir);

        const result = await window.electronAPI!.git.init(rootDir);
        if (result.error) {
          console.error('[init] Git init failed:', result.error);
          return false;
        }

        console.log('[init] Git repository initialized via IPC');
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
      console.log('[init] Initializing git repository (browser)...');

      await git.init({
        fs: fsAdapter,
        dir: '.',
        defaultBranch: 'main',
      });
      console.log('[init] Git repository initialized');

      // Create HEAD pointing to main branch (required before first commit)
      try {
        await fsAdapter.promises.writeFile('.git/HEAD', 'ref: refs/heads/main\n');
        console.log('[init] Created .git/HEAD');
      } catch (err) {
        console.error('[init] Failed to create HEAD:', err);
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
   * Browser: use git.statusMatrix with fsAdapter (now that FSAdapter correctly throws ENOENT)
   * Electron: use git.statusMatrix via IPC
   */
  async getStatus(): Promise<FileStatus[]> {
    if (!this.initialized) return [];

    try {
      let result: FileStatus[] = [];
      // Track ALL files from statusMatrix (including unchanged) to avoid
      // re-adding committed files as 'new' during file enumeration
      const statusMatrixFiles = new Set<string>();

      // Electron path: use IPC for proper git status
      if (isElectronEnv()) {
        const status = await window.electronAPI!.git.statusMatrix(this.getRootDir());
        console.log('[getStatus] Raw statusMatrix (Electron):', status);

        if (Array.isArray(status)) {
          result = status
            .map(([filepath, head, workdir, stage]) => {
              // Track all files from statusMatrix
              statusMatrixFiles.add(filepath);

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
      } else {
        // Browser path: Use git.statusMatrix directly with fsAdapter
        // (Now that FSAdapter correctly throws ENOENT, git objects persist properly)
        console.log('[getStatus] Using git.statusMatrix (browser)');
        try {
          const status = await git.statusMatrix({ fs: fsAdapter, dir: this.getRootDir() });
          console.log('[getStatus] Raw statusMatrix (browser):', status);

          if (Array.isArray(status)) {
            result = status
              .map(([filepath, head, workdir, stage]) => {
                let statusStr = 'unchanged';
                // [HEAD, WORKDIR, STAGE]
                // [0, 2, 0] = new file, not staged
                // [0, 2, 2] = new file, staged
                // [1, 2, 1] = modified, not staged
                // [1, 2, 2] = modified, staged
                // [1, 0, 0] = deleted, not staged
                // [1, 1, 1] = unchanged (committed)
                // [1, 2, 3] = modified in workdir (stage has old version)
                console.log(
                  `[getStatus] File: ${filepath} HEAD=${head} WORKDIR=${workdir} STAGE=${stage}`
                );

                // Track this file regardless of status
                statusMatrixFiles.add(filepath);

                if (head === 1 && workdir === 1 && stage === 1) {
                  statusStr = 'unchanged'; // File is committed and unchanged
                } else if (head === 1 && workdir === 2 && stage === 2) {
                  statusStr = 'modified';
                } else if (head === 0 && workdir === 2 && stage === 0) {
                  statusStr = 'new';
                } else if (head === 0 && workdir === 2 && stage === 2) {
                  statusStr = 'added';
                } else if (head === 1 && workdir === 0) {
                  statusStr = 'deleted';
                } else if (head === 1 && workdir === 2 && stage === 1) {
                  statusStr = 'modified';
                } else if (head === 1 && workdir === 2 && stage === 3) {
                  // stage === 3 means the staged version differs from workdir
                  statusStr = 'modified';
                }

                return {
                  path: filepath,
                  status: statusStr,
                };
              })
              .filter((f) => f.status !== 'unchanged');
          }
        } catch (statusError) {
          console.error(
            '[getStatus] statusMatrix failed, falling back to file enumeration:',
            statusError
          );
          // Fall through to file enumeration below
        }
      }

      // Always enumerate artifact files directly
      // For Electron, this supplements git status; for Browser, this is the primary method
      // Use statusMatrixFiles to avoid re-adding committed files as 'new'
      // Fall back to result paths if statusMatrix failed or wasn't available
      const trackedPaths =
        statusMatrixFiles.size > 0 ? statusMatrixFiles : new Set(result.map((f) => f.path));
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
      console.log('[getStatus] Final result:', allFiles);
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

      // Use empty cache object to force disk writes (no in-memory caching)
      const cache = {};

      await git.add({ fs: fsAdapter, dir: this.getRootDir(), filepath, cache });

      const commitOid = await git.commit({
        fs: fsAdapter,
        dir: this.getRootDir(),
        message,
        author: { name: 'ReqTrace User', email: 'user@reqtrace.local' },
        cache,
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
      console.warn('[realGitService][getHistory] Not initialized');
      return [];
    }

    try {
      let commits: any[];
      console.log(
        '[realGitService][getHistory] Called for filepath:',
        filepath,
        'repo:',
        this.getRootDir()
      );

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
          oid: log.oid,
          message: log.commit.message,
          author: log.commit.author.name,
          timestamp: log.commit.author.timestamp * 1000, // Convert seconds to ms
        }));
      }

      if (!commits || commits.length === 0) {
        console.warn('[realGitService][getHistory] No commits found for filepath:', filepath);
      } else {
        console.log(
          '[realGitService][getHistory] Found commits:',
          commits.map((c) => c.oid || c.hash)
        );
      }

      return Array.isArray(commits)
        ? commits.map((commit) => ({
            hash: commit.oid,
            message: commit.message,
            author: commit.author,
            timestamp: commit.timestamp,
          }))
        : [];
    } catch (error) {
      console.error(
        '[realGitService][getHistory] Failed to get git history:',
        error,
        'filepath:',
        filepath
      );
      return [];
    }
  }

  /**
   * Read file content at a specific commit
   */
  async readFileAtCommit(filepath: string, commitHash: string): Promise<string | null> {
    try {
      console.log(
        '[realGitService][readFileAtCommit] Called for filepath:',
        filepath,
        'commitHash:',
        commitHash,
        'repo:',
        this.getRootDir()
      );
      // Use isomorphic-git to read file at commit
      const { blob } = await git.readBlob({
        fs: fsAdapter,
        dir: this.getRootDir(),
        oid: commitHash,
        filepath,
      });
      if (!blob) {
        console.warn(
          '[realGitService][readFileAtCommit] No blob found for filepath:',
          filepath,
          'commitHash:',
          commitHash
        );
        return null;
      }
      const content = new TextDecoder().decode(blob);
      console.log(
        '[realGitService][readFileAtCommit] Content for',
        filepath,
        'at',
        commitHash,
        ':',
        content.slice(0, 200)
      );
      // Try to extract revision for debug
      try {
        // Use markdownToRequirement for requirements
        if (filepath.startsWith('requirements/')) {
          const parsed = markdownToRequirement(content);
          console.log('[realGitService][readFileAtCommit] Parsed revision:', parsed?.revision);
        }
      } catch (e) {
        console.warn('[realGitService][readFileAtCommit] Error extracting revision:', e);
      }
      return content;
    } catch (error) {
      console.error(
        '[realGitService][readFileAtCommit] Error reading file at commit:',
        error,
        'filepath:',
        filepath,
        'commitHash:',
        commitHash
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

    // Electron path: use IPC
    if (isElectronEnv()) {
      const result = await window.electronAPI!.git.annotatedTag(
        this.getRootDir(),
        tagName,
        message,
        author
      );
      if (result.error) throw new Error(result.error);
    } else {
      // Browser path: use fsAdapter
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
      // Electron path: use IPC
      if (isElectronEnv()) {
        return await window.electronAPI!.git.listTags(this.getRootDir());
      } else {
        // Browser path: use fsAdapter
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
            // Electron path: use IPC
            const oid = await window.electronAPI!.git.resolveRef(this.getRootDir(), name);
            const read = await window.electronAPI!.git.readTag(this.getRootDir(), oid);
            tags.push({
              name,
              message: read.message,
              timestamp: read.timestamp,
              commit: read.object,
            });
          } else {
            // Browser path: use fsAdapter
            const oid = await git.resolveRef({ fs: fsAdapter, dir: this.getRootDir(), ref: name });
            try {
              const tagObject = await git.readTag({ fs: fsAdapter, dir: this.getRootDir(), oid });
              tags.push({
                name,
                message: tagObject.tag.message,
                timestamp: tagObject.tag.tagger.timestamp,
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
                timestamp: log.commit.committer.timestamp,
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
