import { debug } from '../../utils/debug';
/**
 * Git Baseline Service
 *
 * Handles tag/baseline operations: creating, listing, and getting details of tags.
 */

import { gitBackend, getRootDir } from './gitBackend';
import type { TagDetails } from './types';

class GitBaselineService {
  private initialized = false;

  setInitialized(value: boolean): void {
    this.initialized = value;
  }

  /**
   * Create a git tag (baseline)
   */
  async createTag(tagName: string, message: string): Promise<void> {
    if (!this.initialized) {
      throw new Error('Git service not initialized');
    }

    await gitBackend().annotatedTag(getRootDir(), tagName, message);
  }

  /**
   * List all tags
   */
  async listTags(): Promise<string[]> {
    if (!this.initialized) {
      return [];
    }

    try {
      return await gitBackend().listTags(getRootDir());
    } catch {
      return [];
    }
  }

  /**
   * Get all tags with their details (for baselines)
   */
  async getTagsWithDetails(): Promise<TagDetails[]> {
    if (!this.initialized) return [];

    try {
      const backend = gitBackend();
      const dir = getRootDir();
      const tags: TagDetails[] = [];

      for (const name of await backend.listTags(dir)) {
        try {
          const oid = await backend.resolveRef(dir, name);
          try {
            const tag = await backend.readTag(dir, oid);
            tags.push({ name, message: tag.message, timestamp: tag.timestamp, commit: tag.object });
          } catch {
            // Lightweight tag: it points straight at a commit
            const [commit] = await backend.log(dir, { depth: 1, ref: oid });
            tags.push({ name, message: commit.message, timestamp: commit.timestamp, commit: oid });
          }
        } catch (e) {
          debug.warn(`Failed to read tag ${name}:`, e);
        }
      }

      return tags.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Failed to get tags with details:', error);
      return [];
    }
  }
}

export const gitBaselineService = new GitBaselineService();
