/**
 * Link Markdown Utilities
 *
 * Functions for converting Link objects to/from Markdown files with YAML frontmatter.
 */

import type { Link } from '../types';
import type { LinkType } from '../domain/linkTypes';
import {
  objectToYaml,
  parseYamlFrontmatter,
  ensureArray,
  filterValidCustomAttributes,
} from './markdownBase';
import type { CustomAttributeValue } from '../types/customAttributes';

/**
 * Convert a Link object to Markdown with YAML frontmatter
 */
export function linkToMarkdown(link: Link): string {
  const frontmatter = {
    id: link.id,
    sourceId: link.sourceId,
    targetId: link.targetId,
    type: link.type,
    dateCreated: link.dateCreated,
    lastModified: link.lastModified,
    revision: link.revision || '01',
    ...(link.isDeleted && { isDeleted: link.isDeleted }),
    ...(link.deletedAt && { deletedAt: link.deletedAt }),
    customAttributes: filterValidCustomAttributes(link.customAttributes),
  };

  const yaml = objectToYaml(frontmatter);

  const body = `# ${link.id}

Links **${link.sourceId}** to **${link.targetId}** (${link.type.replaceAll('_', ' ')})
`.trim();

  return `${yaml}\n\n${body}`;
}

/**
 * Parse a Markdown file to extract Link data
 */
export function parseMarkdownLink(content: string): Link | null {
  const { frontmatter } = parseYamlFrontmatter(content);

  if (!frontmatter.id || !frontmatter.sourceId || !frontmatter.targetId || !frontmatter.type) {
    return null;
  }

  return {
    id: (frontmatter.id as string) || '',
    sourceId: (frontmatter.sourceId as string) || '',
    targetId: (frontmatter.targetId as string) || '',
    type: frontmatter.type as LinkType,
    dateCreated: (frontmatter.dateCreated as number) || Date.now(),
    lastModified: (frontmatter.lastModified as number) || Date.now(),
    revision: (frontmatter.revision as string) || '01',
    isDeleted: frontmatter.isDeleted as boolean | undefined,
    deletedAt: frontmatter.deletedAt as number | undefined,
    customAttributes: ensureArray<CustomAttributeValue>(frontmatter.customAttributes),
  };
}

/**
 * Generate the next LINK-XXX ID based on existing links
 */
export function generateLinkId(existingIds: string[]): string {
  let maxNum = 0;
  existingIds.forEach((id) => {
    const match = id.match(/^LINK-(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  });
  const nextNum = maxNum + 1;
  return `LINK-${String(nextNum).padStart(3, '0')}`;
}
