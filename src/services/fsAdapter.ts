import { debug } from '../utils/debug';
/**
 * File System Access API adapter for isomorphic-git
 * Adapts the File System Access API to the fs interface expected by isomorphic-git
 */

import { fileSystemService } from './fileSystemService';
import { normalizePath, isGitInternalPath, createENOENT, filterTempFiles } from './pathUtils';

class FSAdapter {
  private fdCounter = 3; // 0,1,2 reserved
  private openFiles = new Map<number, { path: string; position: number; flags: string }>();

  constructor() {
    // Log structure for isomorphic-git compatibility (checked by E2E tests)
    debug.log('[FSAdapter] Initialized');
    debug.log('[FSAdapter] Has promises property:', !!this.promises);
    debug.log('[FSAdapter] promises.enumerable: true');
  }

  setRoot(handle: FileSystemDirectoryHandle) {
    fileSystemService.setDirectoryHandle(handle);
  }

  // isomorphic-git fs interface
  promises = {
    open: async (path: string, flags: string) => {
      const normalizedPath = normalizePath(path);

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
      const normalizedPath = normalizePath(path);

      // For .git internal files, read from filesystem only
      if (isGitInternalPath(normalizedPath)) {
        const fsBinaryContent = await fileSystemService.readFileBinary(normalizedPath);
        if (fsBinaryContent !== null) {
          if (options?.encoding === 'utf8') {
            return new TextDecoder().decode(fsBinaryContent);
          }
          return fsBinaryContent;
        }
        throw createENOENT(path);
      }

      // For working directory files, always return binary (Uint8Array)
      const binaryContent = await fileSystemService.readFileBinary(normalizedPath);
      if (binaryContent !== null) {
        if (options?.encoding === 'utf8') {
          return new TextDecoder().decode(binaryContent);
        }
        return binaryContent;
      }

      throw createENOENT(path);
    },

    writeFile: async (path: string, data: string | Uint8Array): Promise<void> => {
      const normalizedPath = normalizePath(path);

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

          await fileSystemService.writeFileBinary(finalPath, binaryData);
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
      const normalizedPath = normalizePath(path);

      // For .git internal files, check filesystem only
      if (isGitInternalPath(normalizedPath)) {
        try {
          const fsContent = await fileSystemService.readFileBinary(normalizedPath);
          return fsContent !== null;
        } catch {
          return false;
        }
      }

      // For regular files, check filesystem
      const content = await fileSystemService.readFile(normalizedPath);
      return content !== null;
    },

    unlink: async (path: string): Promise<void> => {
      const normalizedPath = normalizePath(path);
      await fileSystemService.deleteFile(normalizedPath);
    },

    readdir: async (path: string): Promise<string[]> => {
      let normalizedPath = normalizePath(path).replace(/\/$/, '');
      if (normalizedPath === '.') normalizedPath = '';

      // For .git internal directories, check filesystem only
      if (normalizedPath.startsWith('.git') || normalizedPath === '.git') {
        try {
          return await fileSystemService.listEntries(normalizedPath);
        } catch {
          return [];
        }
      }

      // For root or other directories, list ALL entries (files and directories)
      try {
        const result = await fileSystemService.listEntries(normalizedPath || '.');
        return filterTempFiles(result);
      } catch {
        return [];
      }
    },

    mkdir: async (path: string, _options?: { recursive?: boolean }): Promise<void> => {
      const normalizedPath = normalizePath(path);
      await fileSystemService.getOrCreateDirectory(normalizedPath);
    },

    rmdir: async (_path: string): Promise<void> => {
      // Not implemented - isomorphic-git rarely needs this
    },

    stat: async (path: string) => {
      const normalizedPath = normalizePath(path);

      // Handle root directory special case
      if (normalizedPath === '' || normalizedPath === '.') {
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

      // For .git internal files, check filesystem only
      if (isGitInternalPath(normalizedPath)) {
        // Try to read as file first (use binary for .git files)
        const fsContent = await fileSystemService.readFileBinary(normalizedPath);
        if (fsContent !== null) {
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

        // Check if it's a directory on filesystem
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

        throw createENOENT(path);
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

      // Check if it's a directory
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

      throw createENOENT(path);
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
    await this.promises.writeFile(path, data);
  };
}

export const fsAdapter = new FSAdapter();
