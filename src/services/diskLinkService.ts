/**
 * Disk Link Service
 *
 * CRUD operations for Link entities stored in the links/ folder.
 * Each link is a Markdown file with YAML frontmatter.
 */

import { fileSystemService } from './fileSystemService';
import type { Link } from '../types';
import type { LinkType } from '../utils/linkTypes';
import { getInverseType } from '../utils/linkTypes';
import { linkToMarkdown, parseMarkdownLink } from '../utils/linkMarkdownUtils';

const LINKS_DIR = 'links';
const LINK_COUNTER_FILE = 'counters/links.md';

/**
 * Incoming link representation (from target's perspective)
 */
export interface IncomingLink {
  linkId: string;
  sourceId: string;
  sourceType: string; // Derived from sourceId prefix
  linkType: LinkType; // The inverse type
}

class DiskLinkService {
  /**
   * Initialize links directory
   */
  async initialize(): Promise<void> {
    await fileSystemService.getOrCreateDirectory(LINKS_DIR);
  }

  /**
   * Get counter value from file
   */
  private async getCounter(): Promise<number> {
    try {
      const content = await fileSystemService.readFile(LINK_COUNTER_FILE);
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
  private async setCounter(value: number): Promise<void> {
    await fileSystemService.writeFile(LINK_COUNTER_FILE, String(value));
  }

  /**
   * Get next link ID
   */
  async getNextId(): Promise<string> {
    const current = await this.getCounter();
    const next = current + 1;
    await this.setCounter(next);
    return `LINK-${String(next).padStart(3, '0')}`;
  }

  /**
   * Recalculate counter from existing link files
   */
  async recalculateCounter(): Promise<void> {
    const links = await this.getAllLinks();
    let maxNum = 0;

    for (const link of links) {
      const match = link.id.match(/LINK-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }

    await this.setCounter(maxNum);
  }

  /**
   * Get all links
   */
  async getAllLinks(): Promise<Link[]> {
    const links: Link[] = [];

    try {
      const files = await fileSystemService.listFiles(LINKS_DIR);

      for (const file of files) {
        if (!file.endsWith('.md')) continue;

        const content = await fileSystemService.readFile(`${LINKS_DIR}/${file}`);
        if (content) {
          const link = parseMarkdownLink(content);
          if (link) {
            links.push(link);
          }
        }
      }
    } catch {
      // Directory might not exist
    }

    return links;
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
        sourceType: this.getArtifactType(link.sourceId),
        linkType: getInverseType(link.type),
      }));
  }

  /**
   * Create a new link
   */
  async createLink(sourceId: string, targetId: string, type: LinkType): Promise<Link> {
    // Ensure links folder exists
    await this.initialize();

    // Generate new ID
    const id = await this.getNextId();
    const now = Date.now();

    const link: Link = {
      id,
      sourceId,
      targetId,
      type,
      dateCreated: now,
      lastModified: now,
    };

    // Write to file
    const content = linkToMarkdown(link);
    await fileSystemService.writeFile(`${LINKS_DIR}/${id}.md`, content);

    return link;
  }

  /**
   * Delete a link
   */
  async deleteLink(linkId: string): Promise<void> {
    try {
      await fileSystemService.deleteFile(`${LINKS_DIR}/${linkId}.md`);
    } catch (error) {
      console.error(`Failed to delete link ${linkId}:`, error);
      throw error;
    }
  }

  /**
   * Get a single link by ID
   */
  async getLinkById(linkId: string): Promise<Link | null> {
    try {
      const content = await fileSystemService.readFile(`${LINKS_DIR}/${linkId}.md`);
      if (content) {
        return parseMarkdownLink(content);
      }
    } catch {
      // File doesn't exist
    }
    return null;
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
   * Derive artifact type from ID prefix
   */
  private getArtifactType(id: string): string {
    if (id.startsWith('REQ-')) return 'requirement';
    if (id.startsWith('UC-')) return 'usecase';
    if (id.startsWith('TC-')) return 'testcase';
    if (id.startsWith('INFO-')) return 'information';
    return 'unknown';
  }
}

export const diskLinkService = new DiskLinkService();
