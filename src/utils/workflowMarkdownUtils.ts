/**
 * Workflow Markdown Utilities
 *
 * Functions for converting Workflow objects to/from Markdown files with YAML frontmatter.
 */

import type { Workflow } from '../types';
import { objectToYaml, parseYamlFrontmatter, ensureArray } from './markdownBase';

/**
 * Convert a Workflow object to Markdown with YAML frontmatter
 */
export function workflowToMarkdown(workflow: Workflow): string {
  const frontmatter = {
    id: workflow.id,
    title: workflow.title,
    createdBy: workflow.createdBy,
    assignedTo: workflow.assignedTo,
    status: workflow.status,
    artifactIds: workflow.artifactIds || [],
    dateCreated: workflow.dateCreated,
    lastModified: workflow.lastModified,
    revision: workflow.revision,
    approvedBy: workflow.approvedBy || null,
    approvalDate: workflow.approvalDate || null,
    approverComment: workflow.approverComment || null,
    isDeleted: workflow.isDeleted || false,
    deletedAt: workflow.deletedAt || null,
  };

  const yaml = objectToYaml(frontmatter);

  const artifactsList =
    workflow.artifactIds.length > 0
      ? workflow.artifactIds.map((id) => `- ${id}`).join('\n')
      : '_No artifacts linked_';

  let statusText = '_Pending approval_';
  if (workflow.status === 'approved') {
    statusText = `**Approved** by ${workflow.approvedBy} on ${new Date(
      workflow.approvalDate!
    ).toISOString()}${workflow.approverComment ? `\n\n**Comment:**\n${workflow.approverComment}` : ''
      }`;
  } else if (workflow.status === 'rejected') {
    statusText = `**Rejected** by ${workflow.approvedBy}${workflow.approverComment ? `\n\n**Reason:**\n${workflow.approverComment}` : ''
      }`;
  }

  const body = `# ${workflow.title}

${workflow.description || ''}

## Artifacts for Approval
${artifactsList}

## Status
${statusText}
`.trim();

  return `${yaml}\n\n${body}`;
}

/**
 * Parse a Markdown file to extract Workflow data
 */
export function parseMarkdownWorkflow(content: string): Workflow | null {
  const { frontmatter, body } = parseYamlFrontmatter(content);

  if (
    !frontmatter.id ||
    !frontmatter.title ||
    !frontmatter.createdBy ||
    !frontmatter.assignedTo ||
    !frontmatter.status
  ) {
    return null;
  }

  // Description is everything before the first H2 section
  const description = body.split('\n## ')[0].replace(/^# [^\n]+\n+/, '').trim();

  return {
    id: (frontmatter.id as string) || '',
    title: (frontmatter.title as string) || '',
    description,
    createdBy: (frontmatter.createdBy as string) || '',
    assignedTo: (frontmatter.assignedTo as string) || '',
    status: frontmatter.status as 'pending' | 'approved' | 'rejected',
    artifactIds: ensureArray<string>(frontmatter.artifactIds),
    approvedBy: (frontmatter.approvedBy as string) || undefined,
    approvalDate: (frontmatter.approvalDate as number) || undefined,
    approverComment: (frontmatter.approverComment as string) || undefined,
    dateCreated: (frontmatter.dateCreated as number) || Date.now(),
    lastModified: (frontmatter.lastModified as number) || Date.now(),
    isDeleted: (frontmatter.isDeleted as boolean) || false,
    deletedAt: (frontmatter.deletedAt as number) || undefined,
    revision: (frontmatter.revision as string) || '1',
  };
}
