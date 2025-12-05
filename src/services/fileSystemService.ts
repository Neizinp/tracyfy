/**
 * File System Service - Real disk storage using File System Access API
 *
 * This service handles reading/writing to a real directory on disk,
 * with git integration for version control.
 */

// Store the directory handle in IndexedDB for persistence
const DB_NAME = 'reqtrace-fs-handles';
const STORE_NAME = 'handles';

interface DirectoryState {
  handle: FileSystemDirectoryHandle;
  hasGit: boolean;
}

class FileSystemService {
  private directoryHandle: FileSystemDirectoryHandle | null = null;
  private db: IDBDatabase | null = null;

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
   * Check if File System Access API is supported
   */
  isSupported(): boolean {
    return 'showDirectoryPicker' in window;
  }

  /**
   * Prompt user to select a directory
   */
  async selectDirectory(): Promise<DirectoryState> {
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
   * Read a file as text
   */
  async readFile(path: string): Promise<string | null> {
    if (!this.directoryHandle) {
      throw new Error('No directory selected');
    }

    try {
      const parts = path.split('/');
      const fileName = parts.pop()!;
      const dirPath = parts.join('/');

      let dir = this.directoryHandle;
      if (dirPath) {
        dir = await this.getOrCreateDirectory(dirPath);
      }

      const fileHandle = await dir.getFileHandle(fileName);
      const file = await fileHandle.getFile();
      return await file.text();
    } catch {
      return null;
    }
  }

  /**
   * Write text to a file
   */
  async writeFile(path: string, content: string): Promise<void> {
    if (!this.directoryHandle) {
      throw new Error('No directory selected');
    }

    const parts = path.split('/');
    const fileName = parts.pop()!;
    const dirPath = parts.join('/');

    let dir = this.directoryHandle;
    if (dirPath) {
      dir = await this.getOrCreateDirectory(dirPath);
    }

    const fileHandle = await dir.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
  }

  /**
   * Delete a file
   */
  async deleteFile(path: string): Promise<void> {
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
   * Get the current directory path name
   */
  getDirectoryName(): string | null {
    return this.directoryHandle?.name || null;
  }

  /**
   * Check if a directory is currently selected and accessible
   */
  hasDirectory(): boolean {
    return this.directoryHandle !== null;
  }
}

export const fileSystemService = new FileSystemService();
