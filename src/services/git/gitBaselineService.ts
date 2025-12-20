import { debug } from '../../utils/debug';
/**
 * Git Baseline Service
 *
 * Handles tag/baseline operations: creating, listing, and getting details of tags.
 */

import git from 'isomorphic-git';
import { fileSystemService } from '../fileSystemService';
import { fsAdapter } from '../fsAdapter';
import { isElectronEnv, type TagDetails } from './types';

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

    const author = { name: 'Tracyfy User', email: 'user@tracyfy.local' };

    if (isElectronEnv()) {
      const result = await window.electronAPI!.git.annotatedTag(
        getRootDir(),
        tagName,
        message,
        author
      );
      if (result.error) throw new Error(result.error);
    } else {
      await git.annotatedTag({
        fs: fsAdapter,
        dir: getRootDir(),
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
        return await window.electronAPI!.git.listTags(getRootDir());
      } else {
        return await git.listTags({ fs: fsAdapter, dir: getRootDir() });
      }
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
      const tagNames = isElectronEnv()
        ? await window.electronAPI!.git.listTags(getRootDir())
        : await git.listTags({ fs: fsAdapter, dir: getRootDir() });
      const tags: TagDetails[] = [];

      for (const name of tagNames) {
        try {
          if (isElectronEnv()) {
            const oid = await window.electronAPI!.git.resolveRef(getRootDir(), name);
            const read = await window.electronAPI!.git.readTag(getRootDir(), oid);
            tags.push({
              name,
              message: read.message,
              timestamp: read.timestamp * 1000,
              commit: read.object,
            });
          } else {
            const oid = await git.resolveRef({ fs: fsAdapter, dir: getRootDir(), ref: name });
            try {
              const tagObject = await git.readTag({ fs: fsAdapter, dir: getRootDir(), oid });
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
                dir: getRootDir(),
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
