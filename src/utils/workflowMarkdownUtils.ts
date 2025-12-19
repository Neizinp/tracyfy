/**
 * Workflow Markdown Utilities
 *
 * Functions for converting Workflow objects to/from Markdown files with YAML frontmatter.
 */

import type { Workflow } from '../types';

/**
 * Convert a Workflow object to Markdown with YAML frontmatter
 */
export function workflowToMarkdown(workflow: Workflow): string {
  const lines: string[] = [
    '---',
    `id: ${workflow.id}`,
    `title: ${workflow.title}`,
    `createdBy: ${workflow.createdBy}`,
    `assignedTo: ${workflow.assignedTo}`,
    `status: ${workflow.status}`,
    `artifactIds: ${workflow.artifactIds.join(', ')}`,
    `dateCreated: ${workflow.dateCreated}`,
    `lastModified: ${workflow.lastModified}`,
    `revision: ${workflow.revision}`,
  ];

  // Optional fields
  if (workflow.approvedBy) {
    lines.push(`approvedBy: ${workflow.approvedBy}`);
  }
  if (workflow.approvalDate) {
    lines.push(`approvalDate: ${workflow.approvalDate}`);
  }
  if (workflow.approverComment) {
    // Escape newlines in comment
    lines.push(`approverComment: ${workflow.approverComment.replace(/\n/g, '\\n')}`);
  }
  if (workflow.isDeleted) {
    lines.push(`isDeleted: ${workflow.isDeleted}`);
  }
  if (workflow.deletedAt) {
    lines.push(`deletedAt: ${workflow.deletedAt}`);
  }

  lines.push('---');
  lines.push('');
  lines.push(`# ${workflow.title}`);
  lines.push('');

  // Description content (markdown body)
  if (workflow.description) {
    lines.push(workflow.description);
    lines.push('');
  }

  // List linked artifacts
  lines.push('## Artifacts for Approval');
  lines.push('');
  if (workflow.artifactIds.length > 0) {
    workflow.artifactIds.forEach((id) => {
      lines.push(`- ${id}`);
    });
  } else {
    lines.push('_No artifacts linked_');
  }
  lines.push('');

  // Status section
  lines.push('## Status');
  lines.push('');
  if (workflow.status === 'approved') {
    lines.push(
      `**Approved** by ${workflow.approvedBy} on ${new Date(workflow.approvalDate!).toISOString()}`
    );
    if (workflow.approverComment) {
      lines.push('');
      lines.push('**Comment:**');
      lines.push(workflow.approverComment);
    }
  } else if (workflow.status === 'rejected') {
    lines.push(`**Rejected** by ${workflow.approvedBy}`);
    if (workflow.approverComment) {
      lines.push('');
      lines.push('**Reason:**');
      lines.push(workflow.approverComment);
    }
  } else {
    lines.push('_Pending approval_');
  }

  return lines.join('\n') + '\n';
}

/**
 * Parse a Markdown file to extract Workflow data
 */
export function parseMarkdownWorkflow(content: string): Workflow | null {
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
  if (!data.id || !data.title || !data.createdBy || !data.assignedTo || !data.status) {
    return null;
  }

  // Extract markdown body (description) - everything between frontmatter end and "## Artifacts" section
  const bodyMatch = content.match(/---\n\n# [^\n]+\n\n([\s\S]*?)(?=\n## Artifacts|\n## Status|$)/);
  const description = bodyMatch ? bodyMatch[1].trim() : '';

  // Parse artifactIds: comma-separated string -> array
  const artifactIds = data.artifactIds
    ? data.artifactIds
        .split(',')
        .map((id) => id.trim())
        .filter((id) => id.length > 0)
    : [];

  return {
    id: data.id,
    title: data.title,
    description,
    createdBy: data.createdBy,
    assignedTo: data.assignedTo,
    status: data.status as 'pending' | 'approved' | 'rejected',
    artifactIds,
    approvedBy: data.approvedBy || undefined,
    approvalDate: data.approvalDate ? parseInt(data.approvalDate, 10) : undefined,
    approverComment: data.approverComment ? data.approverComment.replace(/\\n/g, '\n') : undefined,
    dateCreated: parseInt(data.dateCreated, 10) || Date.now(),
    lastModified: parseInt(data.lastModified, 10) || Date.now(),
    isDeleted: data.isDeleted === 'true',
    deletedAt: data.deletedAt ? parseInt(data.deletedAt, 10) : undefined,
    revision: data.revision || '1',
  };
}
