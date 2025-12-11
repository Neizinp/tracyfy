/**
 * File System Service - Real disk storage using Electron IPC or File System Access API
 *
 * This service handles reading/writing to a real directory on disk,
 * with git integration for version control.
 * In Electron, uses Node fs via IPC. In browser, uses File System Access API.
 */

// Store the directory handle in IndexedDB for persistence
const DB_NAME = 'reqify-fs-handles';
const STORE_NAME = 'handles';

interface DirectoryState {
  handle?: FileSystemDirectoryHandle;
  hasGit: boolean;
  path?: string;
}

// Check if running in Electron
function isElectron(): boolean {
  return typeof window !== 'undefined' && !!(window as any).electronAPI?.isElectron;
}

// Get Electron API if available
function getElectronAPI(): any {
  return (window as any).electronAPI;
}

class FileSystemService {
  private directoryHandle: FileSystemDirectoryHandle | null = null;
  private db: IDBDatabase | null = null;
  private rootPath: string | null = null; // For Electron: absolute path to root dir

  /**
   * Initialize the IndexedDB for storing directory handles
   */
  private async initDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
    });
  }

  /**
   * Store directory handle in IndexedDB
   */
  async storeHandle(handle: FileSystemDirectoryHandle): Promise<void> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(handle, 'directory');

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Retrieve stored directory handle from IndexedDB
   */
  async getStoredHandle(): Promise<FileSystemDirectoryHandle | null> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get('directory');

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  /**
   * Set the directory handle directly (used by git service)
   */
  setDirectoryHandle(handle: FileSystemDirectoryHandle): void {
    this.directoryHandle = handle;
  }

  /**
   * Check if File System Access API is supported
   */
  isSupported(): boolean {
    return isElectron() || 'showDirectoryPicker' in window;
  }

  /**
   * Prompt user to select a directory
   */
  async selectDirectory(): Promise<DirectoryState> {
    // Electron path: use native dialog
    if (isElectron()) {
      const api = getElectronAPI();
      const result = await api.fs.selectDirectory();

      if (result.canceled) {
        throw new Error('Directory selection was cancelled');
      }

      this.rootPath = result.path;

      // Check if .git exists
      const gitPath = `${this.rootPath}/.git`;
      const gitExists = await api.fs.checkExists(gitPath);

      return { path: this.rootPath, hasGit: gitExists.exists };
    }

    // Browser path: use File System Access API
    if (!this.isSupported()) {
      throw new Error(
        'File System Access API is not supported in this browser. Please use Chrome, Edge, or Opera.'
      );
    }

    try {
      const handle = await window.showDirectoryPicker({
        mode: 'readwrite',
        startIn: 'documents',
      });

      this.directoryHandle = handle;
      await this.storeHandle(handle);

      // Check if .git exists
      const hasGit = await this.checkGitExists();

      return { handle, hasGit };
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        throw new Error('Directory selection was cancelled');
      }
      throw error;
    }
  }

  /**
   * Try to restore previously selected directory
   * Returns null if no permission or handle not found
   */
  async restoreDirectory(): Promise<DirectoryState | null> {
    // Electron: no restore needed, directory is always accessible via IPC
    if (isElectron()) {
      return null;
    }

    // Browser: try to restore FSA handle
    try {
      const handle = await this.getStoredHandle();
      if (!handle) return null;

      // Verify we still have permission
      const permission = await handle.queryPermission({ mode: 'readwrite' });
      if (permission === 'granted') {
        this.directoryHandle = handle;
        const hasGit = await this.checkGitExists();
        return { handle, hasGit };
      }

      // Try to request permission
      const newPermission = await handle.requestPermission({ mode: 'readwrite' });
      if (newPermission === 'granted') {
        this.directoryHandle = handle;
        const hasGit = await this.checkGitExists();
        return { handle, hasGit };
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Check if .git directory exists
   */
  async checkGitExists(): Promise<boolean> {
    if (isElectron()) {
      if (!this.rootPath) return false;
      const api = getElectronAPI();
      const gitPath = `${this.rootPath}/.git`;
      const result = await api.fs.checkExists(gitPath);
      return result.exists;
    }

    if (!this.directoryHandle) return false;

    try {
      await this.directoryHandle.getDirectoryHandle('.git');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get or create a subdirectory
   */
  async getOrCreateDirectory(path: string): Promise<FileSystemDirectoryHandle> {
    if (!this.directoryHandle) {
      throw new Error('No directory selected');
    }

    const parts = path.split('/').filter((p) => p.length > 0);
    let current = this.directoryHandle;

    for (const part of parts) {
      current = await current.getDirectoryHandle(part, { create: true });
    }

    return current;
  }

  /**
   * Check if a directory exists WITHOUT creating it
   */
  async directoryExists(path: string): Promise<boolean> {
    // Electron path: use IPC
    if (isElectron()) {
      if (!this.rootPath) {
        return false;
      }
      const api = getElectronAPI();
      const fullPath = path ? `${this.rootPath}/${path}` : this.rootPath;
      const result = await api.fs.listEntries(fullPath);
      return !result.error;
    }

    // Browser path: use FSA
    if (!this.directoryHandle) {
      return false;
    }

    try {
      const parts = path.split('/').filter((p) => p.length > 0);
      let current = this.directoryHandle;

      for (const part of parts) {
        // Use { create: false } to NOT create missing directories
        current = await current.getDirectoryHandle(part, { create: false });
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Navigate to a directory WITHOUT creating it (returns null if not found)
   */
  async getDirectory(path: string): Promise<FileSystemDirectoryHandle | null> {
    if (!this.directoryHandle) {
      return null;
    }

    try {
      const parts = path.split('/').filter((p) => p.length > 0);
      let current = this.directoryHandle;

      for (const part of parts) {
        // Use { create: false } to NOT create missing directories
        current = await current.getDirectoryHandle(part, { create: false });
      }

      return current;
    } catch {
      return null;
    }
  }

  /**
   * Read a file as text
   */
  async readFile(path: string): Promise<string | null> {
    // Electron path: use IPC
    if (isElectron()) {
      if (!this.rootPath) {
        throw new Error('No directory selected');
      }
      const api = getElectronAPI();
      const fullPath = `${this.rootPath}/${path}`;
      const result = await api.fs.readFile(fullPath);

      if (result.notFound) return null;
      if (result.error) throw new Error(result.error);
      return result.content;
    }

    // Browser path: use FSA
    if (!this.directoryHandle) {
      throw new Error('No directory selected');
    }

    try {
      const parts = path.split('/');
      const fileName = parts.pop()!;
      const dirPath = parts.join('/');

      let dir = this.directoryHandle;
      if (dirPath) {
        // Use getDirectory (doesn't create) instead of getOrCreateDirectory
        const existingDir = await this.getDirectory(dirPath);
        if (!existingDir) return null;
        dir = existingDir;
      }

      const fileHandle = await dir.getFileHandle(fileName);
      const file = await fileHandle.getFile();
      return await file.text();
    } catch {
      return null;
    }
  }

  /**
   * Read a file as binary data
   */
  async readFileBinary(path: string): Promise<Uint8Array | null> {
    console.log('[readFileBinary] Called for path:', path);

    // Electron path: use IPC
    if (isElectron()) {
      if (!this.rootPath) {
        throw new Error('No directory selected');
      }
      const api = getElectronAPI();
      const fullPath = `${this.rootPath}/${path}`;
      const result = await api.fs.readFileBinary(fullPath);

      if (result.notFound) return null;
      if (result.error) throw new Error(result.error);
      return new Uint8Array(result.data);
    }

    // Browser path: use FSA
    if (!this.directoryHandle) {
      throw new Error('No directory selected');
    }

    try {
      const parts = path.split('/');
      const fileName = parts.pop()!;
      const dirPath = parts.join('/');

      console.log('[readFileBinary] fileName:', fileName, 'dirPath:', dirPath);

      let dir = this.directoryHandle;
      if (dirPath) {
        // Use getDirectory (doesn't create) instead of getOrCreateDirectory
        const existingDir = await this.getDirectory(dirPath);
        if (!existingDir) {
          console.log('[readFileBinary] Directory not found:', dirPath);
          return null;
        }
        dir = existingDir;
      }

      const fileHandle = await dir.getFileHandle(fileName);
      const file = await fileHandle.getFile();
      const arrayBuffer = await file.arrayBuffer();
      console.log('[readFileBinary] Success, bytes:', arrayBuffer.byteLength);
      return new Uint8Array(arrayBuffer);
    } catch (e) {
      console.log('[readFileBinary] Error reading file:', path, e);
      return null;
    }
  }

  /**
   * Write text to a file
   */
  async writeFile(path: string, content: string): Promise<void> {
    console.log(`[writeFile] Called for path: ${path}`);

    // Electron path: use IPC
    if (isElectron()) {
      if (!this.rootPath) {
        console.error('[writeFile] No directory selected');
        throw new Error('No directory selected');
      }
      const api = getElectronAPI();
      const fullPath = `${this.rootPath}/${path}`;

      // Create parent directories if needed
      const parts = path.split('/');
      if (parts.length > 1) {
        const dirPath = `${this.rootPath}/${parts.slice(0, -1).join('/')}`;
        await api.fs.mkdir(dirPath);
      }

      const result = await api.fs.writeFile(fullPath, content);

      if (result.error) {
        console.error(`[writeFile] Error writing file: ${path}`, result.error);
        throw new Error(result.error);
      }
      console.log(`[writeFile] Successfully wrote file: ${path}`);
      return;
    }

    // Browser path: use FSA
    if (!this.directoryHandle) {
      console.error('[writeFile] No directory selected');
      throw new Error('No directory selected');
    }

    const parts = path.split('/');
    const fileName = parts.pop()!;
    const dirPath = parts.join('/');

    let dir = this.directoryHandle;
    if (dirPath) {
      dir = await this.getOrCreateDirectory(dirPath);
    }

    try {
      const fileHandle = await dir.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();
      console.log(`[writeFile] Successfully wrote file: ${path}`);
    } catch (error) {
      // If path exists as directory instead of file, remove it and retry
      if (error instanceof DOMException && error.name === 'TypeMismatchError') {
        console.warn(`[writeFile] ${fileName} exists as directory, removing it...`);
        try {
          await dir.removeEntry(fileName, { recursive: true });
          // Retry write
          const fileHandle = await dir.getFileHandle(fileName, { create: true });
          const writable = await fileHandle.createWritable();
          await writable.write(content);
          await writable.close();
          console.log(`[writeFile] Successfully wrote file after cleanup: ${path}`);
          return;
        } catch (retryError) {
          console.error(`[writeFile] Retry failed for: ${path}`, retryError);
          throw retryError;
        }
      }
      console.error(`[writeFile] Error writing file: ${path}`, error);
      throw error;
    }
  }

  /**
   * Write binary data to a file
   */
  async writeFileBinary(path: string, content: Uint8Array | ArrayBuffer): Promise<void> {
    console.log(`[writeFileBinary] Called for path: ${path}`);

    // Electron path: use IPC
    if (isElectron()) {
      if (!this.rootPath) {
        console.error('[writeFileBinary] No directory selected');
        throw new Error('No directory selected');
      }
      const api = getElectronAPI();
      const fullPath = `${this.rootPath}/${path}`;

      // Create parent directories if needed
      const parts = path.split('/');
      if (parts.length > 1) {
        const dirPath = `${this.rootPath}/${parts.slice(0, -1).join('/')}`;
        await api.fs.mkdir(dirPath);
      }

      // Convert to plain array for IPC
      const dataArray = Array.from(
        content instanceof ArrayBuffer ? new Uint8Array(content) : content
      );
      const result = await api.fs.writeFileBinary(fullPath, dataArray);

      if (result.error) {
        console.error(`[writeFileBinary] Error writing binary file: ${path}`, result.error);
        throw new Error(result.error);
      }
      console.log(`[writeFileBinary] Successfully wrote binary file: ${path}`);
      return;
    }

    // Browser path: use FSA
    if (!this.directoryHandle) {
      console.error('[writeFileBinary] No directory selected');
      throw new Error('No directory selected');
    }

    const parts = path.split('/');
    const fileName = parts.pop()!;
    const dirPath = parts.join('/');

    let dir = this.directoryHandle;
    if (dirPath) {
      dir = await this.getOrCreateDirectory(dirPath);
    }

    try {
      const fileHandle = await dir.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      // Slice exactly the bytes we need in case this view does not start at offset 0
      const buffer =
        content instanceof ArrayBuffer
          ? content
          : content.buffer.slice(content.byteOffset, content.byteOffset + content.byteLength);
      await writable.write(buffer as ArrayBuffer);
      await writable.close();
      console.log(`[writeFileBinary] Successfully wrote binary file: ${path}`);
    } catch (error) {
      // If path exists as directory instead of file, remove it and retry
      if (error instanceof DOMException && error.name === 'TypeMismatchError') {
        console.warn(`[writeFileBinary] ${fileName} exists as directory, removing it...`);
        try {
          await dir.removeEntry(fileName, { recursive: true });
          // Retry write
          const fileHandle = await dir.getFileHandle(fileName, { create: true });
          const writable = await fileHandle.createWritable();
          const buffer =
            content instanceof ArrayBuffer
              ? content
              : content.buffer.slice(content.byteOffset, content.byteOffset + content.byteLength);
          await writable.write(buffer as ArrayBuffer);
          await writable.close();
          console.log(`[writeFileBinary] Successfully wrote binary file after cleanup: ${path}`);
          return;
        } catch (retryError) {
          console.error(`[writeFileBinary] Retry failed for: ${path}`, retryError);
          throw retryError;
        }
      }
      console.error(`[writeFileBinary] Error writing binary file: ${path}`, error);
      throw error;
    }
  }

  /**
   * Delete a file
   */
  async deleteFile(path: string): Promise<void> {
    // Electron path: use IPC
    if (isElectron()) {
      if (!this.rootPath) {
        throw new Error('No directory selected');
      }
      const api = getElectronAPI();
      const fullPath = `${this.rootPath}/${path}`;
      await api.fs.deleteFile(fullPath);
      return;
    }

    // Browser path: use FSA
    if (!this.directoryHandle) {
      throw new Error('No directory selected');
    }

    try {
      const parts = path.split('/');
      const fileName = parts.pop()!;
      const dirPath = parts.join('/');

      let dir = this.directoryHandle;
      if (dirPath) {
        for (const part of dirPath.split('/').filter((p) => p)) {
          dir = await dir.getDirectoryHandle(part);
        }
      }

      await dir.removeEntry(fileName);
    } catch {
      // File doesn't exist, ignore
    }
  }

  /**
   * List files in a directory
   */
  async listFiles(path: string): Promise<string[]> {
    // Electron path: use IPC
    if (isElectron()) {
      if (!this.rootPath) {
        throw new Error('No directory selected');
      }
      const api = getElectronAPI();
      const fullPath = path ? `${this.rootPath}/${path}` : this.rootPath;
      const result = await api.fs.listFiles(fullPath);

      if (result.error) return [];
      return result.files;
    }

    // Browser path: use FSA
    if (!this.directoryHandle) {
      throw new Error('No directory selected');
    }

    try {
      const dir = await this.getOrCreateDirectory(path);
      const files: string[] = [];

      for await (const [name, handle] of dir.entries()) {
        if (handle.kind === 'file') {
          files.push(name);
        }
      }

      return files;
    } catch {
      return [];
    }
  }

  /**
   * List all entries (files AND directories) in a directory
   */
  async listEntries(path: string): Promise<string[]> {
    // Electron path: use IPC
    if (isElectron()) {
      if (!this.rootPath) {
        throw new Error('No directory selected');
      }
      const api = getElectronAPI();
      const fullPath = path && path !== '.' ? `${this.rootPath}/${path}` : this.rootPath;
      const result = await api.fs.listEntries(fullPath);

      if (result.error) return [];
      return result.entries;
    }

    // Browser path: use FSA
    if (!this.directoryHandle) {
      throw new Error('No directory selected');
    }

    try {
      // Handle root directory specially
      let dir: FileSystemDirectoryHandle;
      if (!path || path === '.' || path === '') {
        dir = this.directoryHandle;
      } else {
        const maybeDir = await this.getDirectory(path);
        if (!maybeDir) {
          return [];
        }
        dir = maybeDir;
      }

      const entries: string[] = [];

      for await (const [name] of dir.entries()) {
        entries.push(name);
      }

      return entries;
    } catch {
      return [];
    }
  }

  /**
   * Get the current directory path name
   */
  getDirectoryName(): string | null {
    if (isElectron()) {
      return this.rootPath ? this.rootPath.split('/').pop() || null : null;
    }
    return this.directoryHandle?.name || null;
  }

  /**
   * Get the full root path (Electron only)
   */
  getRootPath(): string | null {
    return this.rootPath;
  }

  /**
   * Check if a directory is currently selected and accessible
   */
  hasDirectory(): boolean {
    if (isElectron()) {
      return this.rootPath !== null;
    }
    return this.directoryHandle !== null;
  }
}

export const fileSystemService = new FileSystemService();
