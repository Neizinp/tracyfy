/**
 * Base Artifact Service
 *
 * Provides generic CRUD operations for all artifact types.
 */

import { BaseDiskService } from './baseDiskService';
import { STORED_TYPES, type StoredType } from './storedTypes';
import { debug } from '../utils/debug';

export interface ArtifactSerializer<T> {
  serialize: (item: T) => string;
  /** The ID is the file name. May throw (FileFormatError) when the file does not fit */
  deserialize: (id: string, content: string) => T | null;
}

/** A file that could not be read, and why */
export interface FileProblem {
  path: string;
  message: string;
}

export class BaseArtifactService<T extends { id: string }> extends BaseDiskService {
  private typeKey: StoredType;
  private serializer: ArtifactSerializer<T>;
  private listeners: Set<() => void> = new Set();

  constructor(typeKey: StoredType, serializer: ArtifactSerializer<T>) {
    super();
    this.typeKey = typeKey;
    this.serializer = serializer;
  }

  public serialize(item: T): string {
    return this.serializer.serialize(item);
  }

  public deserialize(id: string, content: string): T | null {
    return this.serializer.deserialize(id, content);
  }

  protected get config() {
    const config = STORED_TYPES[this.typeKey];
    if (!config) {
      throw new Error(`Artifact configuration not found for type: ${this.typeKey}`);
    }
    return config;
  }

  /**
   * Subscribe to changes (save/delete) in this artifact type
   */
  public subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all subscribers of a change
   */
  protected notify(): void {
    this.listeners.forEach((callback) => {
      try {
        callback();
      } catch (err) {
        console.error(
          `[BaseArtifactService] Error in subscriber callback for ${this.typeKey}:`,
          err
        );
      }
    });
  }

  private getFilePath(id: string): string {
    const folder = this.config.folder;
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
    this.notify();
    return item;
  }

  /**
   * Delete an artifact from disk and optionally commit to git
   */
  async delete(id: string, commitMessage?: string): Promise<void> {
    const path = this.getFilePath(id);
    await this.deleteFile(path, commitMessage);
    debug.log(`[BaseArtifactService] Deleted ${this.typeKey}: ${id}`);
    this.notify();
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

  /** Every artifact of this type on disk */
  async loadAll(includeDeleted: boolean = false): Promise<T[]> {
    return (await this.loadAllWithProblems(includeDeleted)).items;
  }

  /**
   * Every artifact of this type, plus the files that could not be read.
   * A broken file is reported, never silently left out or turned into wrong data.
   */
  async loadAllWithProblems(
    includeDeleted: boolean = false
  ): Promise<{ items: T[]; problems: FileProblem[] }> {
    const folder = this.config.folder;
    const files = (await this.listFiles(folder)).filter((file) => file.endsWith('.md'));
    const contents = await Promise.all(files.map((file) => this.readTextFile(`${folder}/${file}`)));

    const items: T[] = [];
    const problems: FileProblem[] = [];
    files.forEach((file, i) => {
      const path = `${folder}/${file}`;
      try {
        const item = this.serializer.deserialize(file.slice(0, -'.md'.length), contents[i]);
        if (!item) throw new Error('not a complete file');
        if (!includeDeleted && (item as { isDeleted?: boolean }).isDeleted) return;
        items.push(item);
      } catch (err) {
        problems.push({ path, message: err instanceof Error ? err.message : String(err) });
      }
    });
    if (problems.length > 0) debug.warn(`[BaseArtifactService] Unreadable files:`, problems);
    return { items, problems };
  }

  /** One artifact, or null if its file is missing or cannot be read */
  async load(id: string): Promise<T | null> {
    const content = await this.readTextFile(this.getFilePath(id));
    if (!content) return null;
    try {
      return this.serializer.deserialize(id, content);
    } catch {
      return null;
    }
  }
}
