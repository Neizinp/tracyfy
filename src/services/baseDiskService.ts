/**
 * Base Disk Service
 *
 * Provides generic, robust methods for interacting with the filesystem and Git.
 * Serves as a base for all other services that require disk storage.
 */

import { fileSystemService } from './fileSystemService';
import { realGitService } from './realGitService';
import { debug } from '../utils/debug';

export class BaseDiskService {
  /**
   * Ensure a directory exists
   */
  async ensureDirectory(path: string): Promise<void> {
    await fileSystemService.getOrCreateDirectory(path);
  }

  /**
   * Check if a path exists
   */
  async exists(path: string): Promise<boolean> {
    try {
      const content = await fileSystemService.readFile(path);
      if (content !== null) return true;
    } catch {
      // Ignore
    }

    try {
      return await fileSystemService.directoryExists(path);
    } catch {
      return false;
    }
  }

  /**
   * List entries in a directory (files and folders)
   */
  async listEntries(path: string): Promise<string[]> {
    try {
      return await fileSystemService.listEntries(path);
    } catch (err) {
      debug.log(`[BaseDiskService] Failed to list entries in ${path}:`, err);
      return [];
    }
  }

  /**
   * List files in a directory
   */
  async listFiles(path: string): Promise<string[]> {
    try {
      return await fileSystemService.listFiles(path);
    } catch (err) {
      debug.log(`[BaseDiskService] Failed to list files in ${path}:`, err);
      return [];
    }
  }

  /**
   * Read a text file with a default value
   */
  async readTextFile(path: string, defaultValue: string = ''): Promise<string> {
    try {
      const content = await fileSystemService.readFile(path);
      return content !== null ? content.trim() : defaultValue;
    } catch (err) {
      debug.log(`[BaseDiskService] Failed to read file ${path}, using default.`, err);
      return defaultValue;
    }
  }

  /**
   * Write a text file and optionally commit it to Git
   */
  async writeTextFile(path: string, content: string, commitMessage?: string): Promise<void> {
    try {
      // Ensure parent directory exists
      const lastSlash = path.lastIndexOf('/');
      if (lastSlash !== -1) {
        const dir = path.substring(0, lastSlash);
        await this.ensureDirectory(dir);
      }

      await fileSystemService.writeFile(path, content);

      if (commitMessage) {
        await realGitService.commitFile(path, commitMessage);
      }
    } catch (err) {
      debug.log(`[BaseDiskService] Failed to write file ${path}:`, err);
      throw err;
    }
  }

  /**
   * Delete a file and optionally commit the deletion
   */
  async deleteFile(path: string, commitMessage?: string): Promise<void> {
    try {
      await fileSystemService.deleteFile(path);

      if (commitMessage) {
        await realGitService.commitFile(path, commitMessage);
      }
    } catch (err) {
      debug.log(`[BaseDiskService] Failed to delete file ${path}:`, err);
      throw err;
    }
  }

  /**
   * Read a JSON file
   */
  async readJsonFile<T>(path: string, defaultValue: T | null = null): Promise<T | null> {
    try {
      const content = await fileSystemService.readFile(path);
      if (content === null) return defaultValue;
      return JSON.parse(content) as T;
    } catch (err) {
      debug.log(`[BaseDiskService] Failed to read JSON file ${path}:`, err);
      return defaultValue;
    }
  }

  /**
   * Write a JSON file
   */
  async writeJsonFile<T>(path: string, data: T, commitMessage?: string): Promise<void> {
    const content = JSON.stringify(data, null, 2);
    await this.writeTextFile(path, content, commitMessage);
  }
}

export const baseDiskService = new BaseDiskService();
