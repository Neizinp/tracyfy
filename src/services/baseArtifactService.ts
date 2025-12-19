/**
 * Base Artifact Service
 *
 * Provides generic CRUD operations for all artifact types.
 */

import { BaseDiskService } from './baseDiskService';
import { ARTIFACT_CONFIG } from '../constants/artifactConfig';
import { debug } from '../utils/debug';

export interface ArtifactSerializer<T> {
  serialize: (item: T) => string;
  deserialize: (content: string) => T | null;
}

export class BaseArtifactService<T extends { id: string }> extends BaseDiskService {
  private typeKey: string;
  private serializer: ArtifactSerializer<T>;

  constructor(typeKey: string, serializer: ArtifactSerializer<T>) {
    super();
    this.typeKey = typeKey;
    this.serializer = serializer;
  }

  public serialize(item: T): string {
    return this.serializer.serialize(item);
  }

  public deserialize(content: string): T | null {
    return this.serializer.deserialize(content);
  }

  protected get config() {
    const config = ARTIFACT_CONFIG[this.typeKey];
    if (!config) {
      throw new Error(`Artifact configuration not found for type: ${this.typeKey}`);
    }
    return config;
  }

  private getFilePath(id: string): string {
    const folder = this.config.folder;
    // Standardize on .md for all text-based storage including counters
    return `${folder}/${id}.md`;
  }

  /**
   * Initialize the service (ensure directory exists)
   */
  async initialize(): Promise<void> {
    await this.ensureDirectory(this.config.folder);
  }

  /**
   * Save an artifact to disk and optionally commit to git
   */
  async save(item: T, commitMessage?: string): Promise<T> {
    const path = this.getFilePath(item.id);
    const content = this.serializer.serialize(item);
    await this.writeTextFile(path, content, commitMessage);
    debug.log(`[BaseArtifactService] Saved ${this.typeKey}: ${item.id}`);
    return item;
  }

  /**
   * Delete an artifact from disk and optionally commit to git
   */
  async delete(id: string, commitMessage?: string): Promise<void> {
    const path = this.getFilePath(id);
    await this.deleteFile(path, commitMessage);
    debug.log(`[BaseArtifactService] Deleted ${this.typeKey}: ${id}`);
  }

  /**
   * Soft delete an artifact by setting isDeleted flag
   */
  async softDelete(id: string, commitMessage?: string): Promise<void> {
    const item = await this.load(id);
    if (!item) return;

    const updated = {
      ...item,
      isDeleted: true,
      deletedAt: Date.now(),
      lastModified: Date.now(),
    };

    await this.save(updated as unknown as T, commitMessage);
    debug.log(`[BaseArtifactService] Soft deleted ${this.typeKey}: ${id}`);
  }

  /**
   * Load all artifacts of this type from disk
   */
  async loadAll(includeDeleted: boolean = false): Promise<T[]> {
    const items: T[] = [];
    const folder = this.config.folder;
    const extension = '.md';

    try {
      const files = await this.listFiles(folder);
      for (const file of files) {
        if (!file.endsWith(extension)) continue;

        const content = await this.readTextFile(`${folder}/${file}`);
        if (content) {
          const item = this.serializer.deserialize(content);
          if (item) {
            if (!includeDeleted && (item as { isDeleted?: boolean }).isDeleted) continue;
            items.push(item);
          }
        }
      }
    } catch {
      debug.log(`[BaseArtifactService] Could not load ${this.typeKey} from ${folder}`);
    }

    return items;
  }

  /**
   * Load a single artifact by ID
   */
  async load(id: string): Promise<T | null> {
    const path = this.getFilePath(id);
    const content = await this.readTextFile(path);
    if (content) {
      return this.serializer.deserialize(content);
    }
    return null;
  }
}
