/**
 * Workflow files: workflows/WF-004.md. The file name is the ID.
 * Workflows are replaced by the lifecycle in step 7 of docs/DESIGN.md.
 */
import type { Workflow, WorkflowAction } from '../types';
import type { CustomAttributeValue } from '../types/customAttributes';
import {
  escapeBodyText as esc,
  joinFrontmatter,
  readBody,
  splitFrontmatter,
} from '../domain/frontmatter';

export function workflowToMarkdown(workflow: Workflow): string {
  const artifactsList =
    (workflow.artifactIds?.length || 0) > 0
      ? workflow.artifactIds!.map((id) => `- ${id}`).join('\n')
      : '_No artifacts linked_';

  let statusText = '_Pending approval_';
  if (workflow.status === 'approved') {
    statusText = `**Approved** by ${workflow.approvedBy} on ${new Date(
      workflow.approvalDate!
    ).toISOString()}`;
  } else if (workflow.status === 'rejected') {
    statusText = `**Rejected** by ${workflow.approvedBy}`;
  }

  return joinFrontmatter(
    {
      title: workflow.title,
      type: workflow.type,
      createdBy: workflow.createdBy,
      assignedTo: workflow.assignedTo,
      status: workflow.status,
      artifactIds: workflow.artifactIds,
      dateCreated: workflow.dateCreated,
      lastModified: workflow.lastModified,
      revision: workflow.revision,
      approvedBy: workflow.approvedBy,
      approvalDate: workflow.approvalDate,
      isDeleted: workflow.isDeleted,
      deletedAt: workflow.deletedAt,
      history: workflow.history,
      customAttributes: workflow.customAttributes,
    },
    [
      `# ${workflow.title}`,
      esc(workflow.description),
      `## Artifacts for Approval\n${artifactsList}`,
      `## Status\n${statusText}`,
      workflow.approverComment ? `## Comment\n${esc(workflow.approverComment)}` : '',
    ]
      .filter(Boolean)
      .join('\n\n')
  );
}

/** Read a workflow file, or null if it is not a complete workflow */
export function parseMarkdownWorkflow(id: string, content: string): Workflow | null {
  let parsed: ReturnType<typeof splitFrontmatter>;
  try {
    parsed = splitFrontmatter(content);
  } catch {
    return null;
  }
  const f = parsed.data;
  if (!f.title || !f.createdBy || !f.assignedTo || !f.status) return null;
  const { text, sections } = readBody(parsed.body);

  return {
    id,
    title: String(f.title),
    type: (f.type as string) || undefined,
    description: text,
    createdBy: String(f.createdBy),
    assignedTo: String(f.assignedTo),
    status: f.status as 'pending' | 'approved' | 'rejected',
    artifactIds: (f.artifactIds as string[]) || [],
    approvedBy: (f.approvedBy as string) || undefined,
    approvalDate: (f.approvalDate as number) || undefined,
    approverComment: sections['Comment'] || undefined,
    dateCreated: (f.dateCreated as number) || 0,
    lastModified: (f.lastModified as number) || 0,
    isDeleted: (f.isDeleted as boolean) || false,
    deletedAt: (f.deletedAt as number) || undefined,
    revision: (f.revision as string) || '01',
    history: (f.history as WorkflowAction[]) || [],
    customAttributes: (f.customAttributes as CustomAttributeValue[]) || [],
  };
}
