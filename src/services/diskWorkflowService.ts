/**
 * Disk Workflow Service
 *
 * CRUD operations for Workflow entities stored in the workflows/ folder.
 * Each workflow is a Markdown file with YAML frontmatter.
 */

import { fileSystemService } from './fileSystemService';
import { realGitService } from './realGitService';
import { diskProjectService } from './diskProjectService';
import type { Workflow } from '../types';
import { workflowToMarkdown, parseMarkdownWorkflow } from '../utils/workflowMarkdownUtils';

const WORKFLOWS_DIR = 'workflows';
const WORKFLOW_COUNTER_FILE = 'counters/workflows.md';

class DiskWorkflowService {
  /**
   * Initialize workflows directory
   */
  async initialize(): Promise<void> {
    await fileSystemService.getOrCreateDirectory(WORKFLOWS_DIR);
  }

  /**
   * Get counter value from file
   */
  private async getCounter(): Promise<number> {
    try {
      const content = await fileSystemService.readFile(WORKFLOW_COUNTER_FILE);
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
    await fileSystemService.writeFile(WORKFLOW_COUNTER_FILE, String(value));
  }

  /**
   * Get next workflow ID
   */
  async getNextId(): Promise<string> {
    const current = await this.getCounter();
    const next = current + 1;
    await this.setCounter(next);
    return `WF-${String(next).padStart(3, '0')}`;
  }

  /**
   * Recalculate counter from existing workflow files
   */
  async recalculateCounter(): Promise<void> {
    const workflows = await this.getAllWorkflows();
    let maxNum = 0;

    for (const workflow of workflows) {
      const match = workflow.id.match(/WF-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }

    await this.setCounter(maxNum);
  }

  /**
   * Get all workflows (excluding deleted)
   */
  async getAllWorkflows(): Promise<Workflow[]> {
    const workflows: Workflow[] = [];

    try {
      const files = await fileSystemService.listFiles(WORKFLOWS_DIR);

      for (const file of files) {
        if (!file.endsWith('.md')) continue;

        const content = await fileSystemService.readFile(`${WORKFLOWS_DIR}/${file}`);
        if (content) {
          const workflow = parseMarkdownWorkflow(content);
          if (workflow && !workflow.isDeleted) {
            workflows.push(workflow);
          }
        }
      }
    } catch {
      // Directory might not exist
    }

    return workflows;
  }

  /**
   * Get a single workflow by ID
   */
  async getWorkflowById(workflowId: string): Promise<Workflow | null> {
    try {
      const content = await fileSystemService.readFile(`${WORKFLOWS_DIR}/${workflowId}.md`);
      if (content) {
        return parseMarkdownWorkflow(content);
      }
    } catch {
      // File doesn't exist
    }
    return null;
  }

  /**
   * Create a new workflow
   */
  async createWorkflow(
    title: string,
    description: string,
    createdBy: string,
    assignedTo: string,
    artifactIds: string[]
  ): Promise<Workflow> {
    // Ensure workflows folder exists
    await this.initialize();

    // Generate new ID
    const id = await diskProjectService.getNextIdWithSync('workflows');
    const now = Date.now();

    const workflow: Workflow = {
      id,
      title,
      description,
      createdBy,
      assignedTo,
      status: 'pending',
      artifactIds,
      dateCreated: now,
      lastModified: now,
    };

    // Write to file
    const content = workflowToMarkdown(workflow);
    await fileSystemService.writeFile(`${WORKFLOWS_DIR}/${id}.md`, content);

    return workflow;
  }

  /**
   * Update an existing workflow
   */
  async updateWorkflow(
    workflowId: string,
    updates: Partial<Pick<Workflow, 'title' | 'description' | 'assignedTo' | 'artifactIds'>>
  ): Promise<Workflow | null> {
    const existingWorkflow = await this.getWorkflowById(workflowId);
    if (!existingWorkflow) {
      console.error(`Workflow ${workflowId} not found`);
      return null;
    }

    const updatedWorkflow: Workflow = {
      ...existingWorkflow,
      ...updates,
      lastModified: Date.now(),
    };

    const content = workflowToMarkdown(updatedWorkflow);
    await fileSystemService.writeFile(`${WORKFLOWS_DIR}/${workflowId}.md`, content);

    return updatedWorkflow;
  }

  /**
   * Approve a workflow
   * - Updates workflow status to 'approved'
   * - Sets approvedBy and approvalDate
   * - Returns the updated workflow
   * Note: Caller is responsible for updating linked artifacts' status and committing
   */
  async approveWorkflow(
    workflowId: string,
    approvedBy: string,
    approverComment?: string
  ): Promise<Workflow | null> {
    const workflow = await this.getWorkflowById(workflowId);
    if (!workflow) {
      console.error(`Workflow ${workflowId} not found`);
      return null;
    }

    if (workflow.status !== 'pending') {
      console.error(`Workflow ${workflowId} is not pending, cannot approve`);
      return null;
    }

    const now = Date.now();
    const updatedWorkflow: Workflow = {
      ...workflow,
      status: 'approved',
      approvedBy,
      approvalDate: now,
      approverComment,
      lastModified: now,
    };

    const content = workflowToMarkdown(updatedWorkflow);
    await fileSystemService.writeFile(`${WORKFLOWS_DIR}/${workflowId}.md`, content);

    return updatedWorkflow;
  }

  /**
   * Reject a workflow
   */
  async rejectWorkflow(
    workflowId: string,
    rejectedBy: string,
    rejectReason?: string
  ): Promise<Workflow | null> {
    const workflow = await this.getWorkflowById(workflowId);
    if (!workflow) {
      console.error(`Workflow ${workflowId} not found`);
      return null;
    }

    if (workflow.status !== 'pending') {
      console.error(`Workflow ${workflowId} is not pending, cannot reject`);
      return null;
    }

    const now = Date.now();
    const updatedWorkflow: Workflow = {
      ...workflow,
      status: 'rejected',
      approvedBy: rejectedBy,
      approvalDate: now,
      approverComment: rejectReason,
      lastModified: now,
    };

    const content = workflowToMarkdown(updatedWorkflow);
    await fileSystemService.writeFile(`${WORKFLOWS_DIR}/${workflowId}.md`, content);

    return updatedWorkflow;
  }

  /**
   * Soft delete a workflow
   */
  async deleteWorkflow(workflowId: string): Promise<void> {
    const workflow = await this.getWorkflowById(workflowId);
    if (!workflow) {
      console.error(`Workflow ${workflowId} not found`);
      return;
    }

    const updatedWorkflow: Workflow = {
      ...workflow,
      isDeleted: true,
      deletedAt: Date.now(),
      lastModified: Date.now(),
    };

    const content = workflowToMarkdown(updatedWorkflow);
    await fileSystemService.writeFile(`${WORKFLOWS_DIR}/${workflowId}.md`, content);
  }

  /**
   * Get workflows assigned to a specific user (pending approval)
   */
  async getWorkflowsAssignedTo(userId: string): Promise<Workflow[]> {
    const allWorkflows = await this.getAllWorkflows();
    return allWorkflows.filter((wf) => wf.assignedTo === userId && wf.status === 'pending');
  }

  /**
   * Get workflows created by a specific user
   */
  async getWorkflowsCreatedBy(userId: string): Promise<Workflow[]> {
    const allWorkflows = await this.getAllWorkflows();
    return allWorkflows.filter((wf) => wf.createdBy === userId);
  }

  /**
   * Commit workflow approval with proper message
   * Auto-commits the approval action with approver's name
   */
  async commitApproval(
    workflowId: string,
    workflowTitle: string,
    approverName: string
  ): Promise<void> {
    const message = `Approved workflow ${workflowId}: ${workflowTitle} by ${approverName}`;
    await realGitService.commitFile(`${WORKFLOWS_DIR}/${workflowId}.md`, message);
  }
}

export const diskWorkflowService = new DiskWorkflowService();
