import { BaseArtifactService } from './baseArtifactService';
import type { Link } from '../types';
import type { LinkType } from '../domain/linkTypes';
import { getInverseType } from '../domain/linkTypes';
import { linkToMarkdown, parseMarkdownLink } from '../utils/linkMarkdownUtils';
import { idAllocator } from '../storage/idAllocator';
import { STORED_TYPES } from './storedTypes';

/**
 * Incoming link representation (from target's perspective)
 */
export interface IncomingLink {
  linkId: string;
  sourceId: string;
  linkType: LinkType; // The inverse type
}

class DiskLinkService extends BaseArtifactService<Link> {
  constructor() {
    super('link', {
      serialize: linkToMarkdown,
      deserialize: parseMarkdownLink,
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
   * Get outgoing links FROM an artifact (where it is the source)
   */
  async getOutgoingLinks(artifactId: string): Promise<Link[]> {
    const allLinks = await this.getAllLinks();
    return allLinks.filter((link) => link.sourceId === artifactId);
  }

  /**
   * Get incoming links TO an artifact (where it is the target)
   * Returns with inverse types computed
   */
  async getIncomingLinks(artifactId: string): Promise<IncomingLink[]> {
    const allLinks = await this.getAllLinks();
    return allLinks
      .filter((link) => link.targetId === artifactId)
      .map((link) => ({
        linkId: link.id,
        sourceId: link.sourceId,
        linkType: getInverseType(link.type),
      }));
  }

  /**
   * Check if a link already exists between two artifacts
   */
  async linkExists(sourceId: string, targetId: string, type?: LinkType): Promise<boolean> {
    const allLinks = await this.getAllLinks();
    return allLinks.some(
      (link) =>
        link.sourceId === sourceId &&
        link.targetId === targetId &&
        (type === undefined || link.type === type)
    );
  }

  /**
   * Create a new link
   */
  async createLink(sourceId: string, targetId: string, type: LinkType): Promise<Link> {
    const nextId = await idAllocator.next(STORED_TYPES.link.folder, STORED_TYPES.link.idPrefix);
    const link: Link = {
      id: nextId,
      sourceId,
      targetId,
      type,
      dateCreated: Date.now(),
      lastModified: Date.now(),
      revision: '01',
    };
    // Link files are hidden from the pending-changes panel, so they are committed immediately
    return this.save(link, `Add link ${link.id}: ${sourceId} ${type} ${targetId}`);
  }

  /**
   * Delete a link
   */
  async deleteLink(id: string): Promise<void> {
    await this.delete(id, `Remove link ${id}`);
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
    return this.save(updatedLink, `Update link ${id}`);
  }
}

export const diskLinkService = new DiskLinkService();
export const linkService = diskLinkService;
