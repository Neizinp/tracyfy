import { BaseArtifactService } from './baseArtifactService';
import { realGitService } from './realGitService';
import type { Workflow } from '../types';
import { workflowToMarkdown, parseMarkdownWorkflow } from '../utils/workflowMarkdownUtils';
import { idService } from './idService';

class DiskWorkflowService extends BaseArtifactService<Workflow> {
  constructor() {
    super('workflows', {
      serialize: workflowToMarkdown,
      deserialize: parseMarkdownWorkflow,
    });
  }

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    await this.loadAll();
  }

  /**
   * Get all workflows
   */
  async getAllWorkflows(includeDeleted: boolean = false): Promise<Workflow[]> {
    return this.loadAll(includeDeleted);
  }

  /**
   * Approve a workflow
   */
  async approveWorkflow(
    workflowId: string,
    approvedBy: string,
    approverComment?: string
  ): Promise<Workflow | null> {
    const workflow = await this.load(workflowId);
    if (!workflow) return null;

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

    await this.save(updatedWorkflow);
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
    const workflow = await this.load(workflowId);
    if (!workflow) return null;

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

    await this.save(updatedWorkflow);
    return updatedWorkflow;
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
   */
  async commitApproval(
    workflowId: string,
    workflowTitle: string,
    approverName: string
  ): Promise<void> {
    const message = `Approved workflow ${workflowId}: ${workflowTitle} by ${approverName}`;
    const folder = this.config.folder;
    await realGitService.commitFile(`${folder}/${workflowId}.md`, message);
  }

  /**
   * Create a new workflow
   */
  async createWorkflow(
    workflow: Omit<Workflow, 'id' | 'dateCreated' | 'lastModified' | 'status'>
  ): Promise<Workflow> {
    const nextId = await idService.getNextIdWithSync('workflows');
    const newWorkflow: Workflow = {
      ...workflow,
      id: nextId,
      status: 'pending',
      dateCreated: Date.now(),
      lastModified: Date.now(),
    };
    return this.save(newWorkflow);
  }

  /**
   * Get workflow by ID
   */
  async getWorkflowById(id: string): Promise<Workflow | null> {
    return this.load(id);
  }

  /**
   * Delete a workflow
   */
  async deleteWorkflow(id: string): Promise<void> {
    await this.delete(id);
  }

  /**
   * Update a workflow
   */
  async updateWorkflow(id: string, updates: Partial<Workflow>): Promise<Workflow | null> {
    const workflow = await this.load(id);
    if (!workflow) return null;

    const updatedWorkflow = {
      ...workflow,
      ...updates,
      lastModified: Date.now(),
    };
    return this.save(updatedWorkflow);
  }
}

export const diskWorkflowService = new DiskWorkflowService();
export const workflowService = diskWorkflowService;
