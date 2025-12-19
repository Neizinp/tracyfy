/**
 * ID Service
 *
 * Centralizes ID generation and counter management for all artifacts.
 * Uses ARTIFACT_CONFIG for prefix and category metadata.
 */

import { fileSystemService } from './fileSystemService';
import { realGitService } from './realGitService';
import { ARTIFACT_CONFIG } from '../constants/artifactConfig';
import { debug } from '../utils/debug';

export class IdService {
  /**
   * Get counter value from file
   */
  async getCounter(type: string): Promise<number> {
    const config = ARTIFACT_CONFIG[type];
    if (!config) {
      throw new Error(`[IdService] No config found for type: ${type}`);
    }

    const filename = `counters/${config.folder}.md`;
    try {
      const content = await fileSystemService.readFile(filename);
      if (content) {
        return parseInt(content.trim(), 10) || 0;
      }
    } catch {
      // File doesn't exist
    }
    return 0;
  }

  /**
   * Set counter value
   */
  async setCounter(type: string, value: number, skipCommit: boolean = false): Promise<void> {
    const config = ARTIFACT_CONFIG[type];
    if (!config) {
      throw new Error(`[IdService] No config found for type: ${type}`);
    }

    const filename = `counters/${config.folder}.md`;
    await fileSystemService.writeFile(filename, String(value));

    // Auto-commit the counter update (unless skipped)
    if (!skipCommit) {
      realGitService.commitFile(filename, `Update ${type} counter`).catch((err) => {
        debug.log(`[IdService] Failed to commit counter for ${type}:`, err);
      });
    }
  }

  /**
   * Get next artifact ID and increment counter
   */
  async getNextId(type: string): Promise<string> {
    const config = ARTIFACT_CONFIG[type];
    if (!config) {
      throw new Error(`[IdService] No config found for type: ${type}`);
    }

    const current = await this.getCounter(type);
    const next = current + 1;
    await this.setCounter(type, next);

    return `${config.idPrefix}-${String(next).padStart(3, '0')}`;
  }

  /**
   * Get multiple artifact IDs at once (batch allocation)
   */
  async getNextIds(type: string, count: number): Promise<string[]> {
    if (count <= 0) return [];

    const config = ARTIFACT_CONFIG[type];
    if (!config) {
      throw new Error(`[IdService] No config found for type: ${type}`);
    }

    const current = await this.getCounter(type);
    const nextEnd = current + count;
    await this.setCounter(type, nextEnd);

    const ids: string[] = [];
    for (let i = current + 1; i <= nextEnd; i++) {
      ids.push(`${config.idPrefix}-${String(i).padStart(3, '0')}`);
    }

    return ids;
  }

  /**
   * Get next artifact ID with remote sync (for collaboration)
   */
  async getNextIdWithSync(type: string): Promise<string> {
    try {
      // Pull latest counters from remote (silently fails if no remote)
      await realGitService.pullCounters();
    } catch (err) {
      debug.log(`[IdService] Failed to pull counters:`, err);
    }

    // Get next ID locally
    const id = await this.getNextId(type);

    try {
      // Push counter update to remote (background, don't block)
      realGitService.pushCounters().catch((err) => {
        debug.log(`[IdService] Failed to push counters:`, err);
      });
    } catch (err) {
      debug.log(`[IdService] Failed to initiate push:`, err);
    }

    return id;
  }
}

export const idService = new IdService();
