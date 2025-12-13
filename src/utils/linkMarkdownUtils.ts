/**
 * Link Markdown Utilities
 *
 * Functions for converting Link objects to/from Markdown files with YAML frontmatter.
 */

import type { Link } from '../types';
import type { LinkType } from './linkTypes';

/**
 * Convert a Link object to Markdown with YAML frontmatter
 */
export function linkToMarkdown(link: Link): string {
  const projectIdsValue = link.projectIds.length > 0 ? link.projectIds.join(', ') : '';
  const lines: string[] = [
    '---',
    `id: ${link.id}`,
    `sourceId: ${link.sourceId}`,
    `targetId: ${link.targetId}`,
    `type: ${link.type}`,
    `projectIds: ${projectIdsValue}`,
    `dateCreated: ${link.dateCreated}`,
    `lastModified: ${link.lastModified}`,
    '---',
    '',
    `# ${link.id}`,
    '',
    `Links **${link.sourceId}** to **${link.targetId}** (${link.type.replace('_', ' ')})`,
    '',
    link.projectIds.length > 0
      ? `**Scope:** ${link.projectIds.join(', ')}`
      : '**Scope:** Global (all projects)',
  ];

  return lines.join('\n') + '\n';
}

/**
 * Parse a Markdown file to extract Link data
 */
export function parseMarkdownLink(content: string): Link | null {
  // Extract YAML frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) {
    return null;
  }

  const frontmatter = frontmatterMatch[1];
  const data: Record<string, string> = {};

  // Parse YAML lines
  frontmatter.split('\n').forEach((line) => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      const value = line.slice(colonIndex + 1).trim();
      data[key] = value;
    }
  });

  // Validate required fields
  if (!data.id || !data.sourceId || !data.targetId || !data.type) {
    return null;
  }

  // Parse projectIds: comma-separated string -> array, empty string -> empty array (global)
  const projectIds = data.projectIds
    ? data.projectIds
        .split(',')
        .map((id) => id.trim())
        .filter((id) => id.length > 0)
    : [];

  return {
    id: data.id,
    sourceId: data.sourceId,
    targetId: data.targetId,
    type: data.type as LinkType,
    projectIds,
    dateCreated: parseInt(data.dateCreated, 10) || Date.now(),
    lastModified: parseInt(data.lastModified, 10) || Date.now(),
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
