/**
 * ID Service
 *
 * Centralizes ID generation and counter management for all artifacts.
 * Uses STORED_TYPES for prefix and folder metadata.
 */

import { BaseDiskService } from './baseDiskService';
import { realGitService } from './realGitService';
import { STORED_TYPES, type StoredType } from './storedTypes';
import { debug } from '../utils/debug';
import { KeyedLock } from '../utils/keyedLock';

export class IdService extends BaseDiskService {
  /** Serializes counter read-modify-write per artifact type to prevent duplicate IDs */
  private counterLock = new KeyedLock();

  /**
   * Get counter value from file
   */
  async getCounter(type: StoredType): Promise<number> {
    const config = STORED_TYPES[type];
    if (!config) {
      throw new Error(`[IdService] No config found for type: ${type}`);
    }

    const filename = `counters/${config.folder}.md`;
    const content = await this.readTextFile(filename, '0');
    return parseInt(content, 10) || 0;
  }

  /**
   * Set counter value
   */
  async setCounter(type: StoredType, value: number, skipCommit: boolean = false): Promise<void> {
    const config = STORED_TYPES[type];
    if (!config) {
      throw new Error(`[IdService] No config found for type: ${type}`);
    }

    const filename = `counters/${config.folder}.md`;
    const commitMessage = skipCommit ? undefined : `Update ${type} counter`;

    await this.writeTextFile(filename, String(value), commitMessage);
  }

  /**
   * Get next artifact ID and increment counter
   */
  async getNextId(type: StoredType): Promise<string> {
    const [id] = await this.getNextIds(type, 1);
    return id;
  }

  /**
   * Get multiple artifact IDs at once (batch allocation).
   * Allocation is serialized per type, so concurrent callers never receive the same ID.
   */
  async getNextIds(type: StoredType, count: number): Promise<string[]> {
    if (count <= 0) return [];

    const config = STORED_TYPES[type];
    if (!config) {
      throw new Error(`[IdService] No config found for type: ${type}`);
    }

    return this.counterLock.run(type, () => this.allocate(type, count));
  }

  /**
   * Raise the counter to at least `value` (never lowers it).
   * Used after importing artifacts with explicit IDs so new IDs don't collide.
   */
  async ensureCounterAtLeast(type: StoredType, value: number): Promise<void> {
    if (!STORED_TYPES[type]) {
      throw new Error(`[IdService] No config found for type: ${type}`);
    }
    await this.counterLock.run(type, async () => {
      const current = await this.getCounter(type);
      if (value > current) {
        await this.setCounter(type, value);
      }
    });
  }

  /**
   * Read-modify-write of the counter. Must only be called while holding counterLock for `type`.
   */
  private async allocate(type: StoredType, count: number): Promise<string[]> {
    const config = STORED_TYPES[type];
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
  async getNextIdWithSync(type: StoredType): Promise<string> {
    if (!STORED_TYPES[type]) {
      throw new Error(`[IdService] No config found for type: ${type}`);
    }

    // Pull + allocate under the same lock so a pull can't interleave with a local allocation
    const id = await this.counterLock.run(type, async () => {
      try {
        // Pull latest counters from remote (silently fails if no remote)
        await realGitService.pullCounters();
      } catch (err) {
        debug.log(`[IdService] Failed to pull counters:`, err);
      }
      const [allocated] = await this.allocate(type, 1);
      return allocated;
    });

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
