import { BaseArtifactService } from './baseArtifactService';
import type { Link } from '../types';
import type { LinkType } from '../utils/linkTypes';
import { getInverseType } from '../utils/linkTypes';
import { linkToMarkdown, parseMarkdownLink } from '../utils/linkMarkdownUtils';
import { getTypeFromId } from '../constants/artifactConfig';
import { idService } from './idService';

/**
 * Incoming link representation (from target's perspective)
 */
export interface IncomingLink {
  linkId: string;
  sourceId: string;
  sourceType: string; // Derived from sourceId prefix
  linkType: LinkType; // The inverse type
}

class DiskLinkService extends BaseArtifactService<Link> {
  constructor() {
    super('links', {
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
        sourceType: getTypeFromId(link.sourceId),
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
   * Get links visible to a specific project
   * Returns links that are global (empty projectIds) OR include the given project ID
   */
  async getLinksForProject(projectId: string): Promise<Link[]> {
    const allLinks = await this.getAllLinks();
    return allLinks.filter(
      (link) =>
        !link.projectIds || link.projectIds.length === 0 || link.projectIds.includes(projectId)
    );
  }

  /**
   * Get global links only (visible to all projects)
   */
  async getGlobalLinks(): Promise<Link[]> {
    const allLinks = await this.getAllLinks();
    return allLinks.filter((link) => !link.projectIds || link.projectIds.length === 0);
  }

  /**
   * Get outgoing links FROM an artifact, filtered by project visibility
   */
  async getOutgoingLinksForProject(artifactId: string, projectId: string): Promise<Link[]> {
    const allLinks = await this.getLinksForProject(projectId);
    return allLinks.filter((link) => link.sourceId === artifactId);
  }

  /**
   * Get incoming links TO an artifact, filtered by project visibility
   */
  async getIncomingLinksForProject(artifactId: string, projectId: string): Promise<IncomingLink[]> {
    const allLinks = await this.getLinksForProject(projectId);
    return allLinks
      .filter((link) => link.targetId === artifactId)
      .map((link) => ({
        linkId: link.id,
        sourceId: link.sourceId,
        sourceType: getTypeFromId(link.sourceId),
        linkType: getInverseType(link.type),
      }));
  }

  /**
   * Create a new link
   */
  async createLink(
    sourceId: string,
    targetId: string,
    type: LinkType,
    projectIds: string[] = []
  ): Promise<Link> {
    const nextId = await idService.getNextIdWithSync('links');
    const link: Link = {
      id: nextId,
      sourceId,
      targetId,
      type,
      projectIds,
      dateCreated: Date.now(),
      lastModified: Date.now(),
      revision: '01',
    };
    return this.save(link);
  }

  /**
   * Delete a link
   */
  async deleteLink(id: string): Promise<void> {
    await this.delete(id);
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
