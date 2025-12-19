/**
 * Base Artifact Service
 *
 * Provides generic CRUD operations for all artifact types.
 */

import { fileSystemService } from './fileSystemService';
import { realGitService } from './realGitService';
import { ARTIFACT_CONFIG } from '../constants/artifactConfig';
import { debug } from '../utils/debug';

export interface ArtifactSerializer<T> {
  serialize: (item: T) => string;
  deserialize: (content: string) => T | null;
}

export class BaseArtifactService<T extends { id: string }> {
  private typeKey: string;
  private serializer: ArtifactSerializer<T>;

  constructor(typeKey: string, serializer: ArtifactSerializer<T>) {
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
   * Save an artifact to disk and optionally commit to git
   */
  async save(item: T, commitMessage?: string): Promise<void> {
    const path = this.getFilePath(item.id);
    const content = this.serializer.serialize(item);

    await fileSystemService.writeFile(path, content);

    if (commitMessage) {
      await realGitService.commitFile(path, commitMessage);
    }

    debug.log(`[BaseArtifactService] Saved ${this.typeKey}: ${item.id}`);
  }

  /**
   * Delete an artifact from disk and optionally commit to git
   */
  async delete(id: string, commitMessage?: string): Promise<void> {
    const path = this.getFilePath(id);
    await fileSystemService.deleteFile(path);

    if (commitMessage) {
      await realGitService.commitFile(path, commitMessage);
    }

    debug.log(`[BaseArtifactService] Deleted ${this.typeKey}: ${id}`);
  }

  /**
   * Load all artifacts of this type from disk
   */
  async loadAll(): Promise<T[]> {
    const items: T[] = [];
    const folder = this.config.folder;
    const extension = '.md';

    try {
      const files = await fileSystemService.listFiles(folder);
      for (const file of files) {
        if (!file.endsWith(extension)) continue;

        const content = await fileSystemService.readFile(`${folder}/${file}`);
        if (content) {
          const item = this.serializer.deserialize(content);
          if (item) {
            items.push(item);
          }
        }
      }
    } catch (err) {
      // Directory might not exist yet
      debug.log(
        `[BaseArtifactService] Could not load ${this.typeKey} from ${folder}:`,
        err instanceof Error ? err.message : String(err)
      );
    }

    return items;
  }

  /**
   * Load a single artifact by ID
   */
  async load(id: string): Promise<T | null> {
    const path = this.getFilePath(id);
    try {
      const content = await fileSystemService.readFile(path);
      if (content) {
        return this.serializer.deserialize(content);
      }
    } catch (err) {
      debug.log(
        `[BaseArtifactService] Could not load ${this.typeKey}: ${id}`,
        err instanceof Error ? err.message : String(err)
      );
    }
    return null;
  }
}
