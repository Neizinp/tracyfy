import { BaseArtifactService } from './baseArtifactService';
import type { Link } from '../types';
import type { LinkType } from '../domain/linkTypes';
import { parseLink, serializeLink } from '../domain/artifactFormat';
import { idAllocator } from '../storage/idAllocator';
import { STORED_TYPES } from './storedTypes';

class DiskLinkService extends BaseArtifactService<Link> {
  constructor() {
    super('link', {
      serialize: serializeLink,
      deserialize: parseLink,
    });
  }

  /**
   * Initialize the service (ensure directory exists)
   */
  async initialize(): Promise<void> {
    await super.initialize();
  }

  /**
   * Get all links
   */
  async getAllLinks(): Promise<Link[]> {
    return this.loadAll();
  }

  /**
   * Create a new link
   */
  async createLink(
    sourceId: string,
    targetId: string,
    type: LinkType,
    reviewed?: string
  ): Promise<Link> {
    const nextId = await idAllocator.next(STORED_TYPES.link.folder, STORED_TYPES.link.idPrefix);
    const link: Link = {
      id: nextId,
      sourceId,
      targetId,
      type,
      ...(reviewed ? { reviewed } : {}),
      dateCreated: Date.now(),
      lastModified: Date.now(),
      revision: '01',
    };
    // Shows up in Pending Changes like any other file
    return this.save(link);
  }

  /**
   * Remove a link. One that was never committed loses its file; a committed
   * one keeps it, marked deleted, so its ID is never handed out again.
   */
  async deleteLink(id: string, committed: boolean): Promise<void> {
    if (committed) await this.softDelete(id);
    else await this.delete(id);
  }

  /**
   * Get link by ID
   */
  async getLinkById(id: string): Promise<Link | null> {
    return this.load(id);
  }

  /**
   * Update a link
   */
  async updateLink(id: string, updates: Partial<Link>): Promise<Link | null> {
    const link = await this.load(id);
    if (!link) return null;

    const updatedLink = {
      ...link,
      ...updates,
      lastModified: Date.now(),
    };
    return this.save(updatedLink);
  }
}

export const diskLinkService = new DiskLinkService();
export const linkService = diskLinkService;
