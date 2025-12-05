export interface Requirement {
  id: string;
  title: string;
  description: string;
  text: string;
  rationale: string;
  parentIds: string[];
  useCaseIds?: string[]; // Which use cases this requirement supports
  status: 'draft' | 'approved' | 'implemented' | 'verified';
  priority: 'low' | 'medium' | 'high';
  author?: string;
  verificationMethod?: string;
  comments?: string;
  dateCreated: number;
  approvalDate?: number;
  lastModified: number;
  isDeleted?: boolean;
  deletedAt?: number;
  revision: string;
}

// Tree node type for rendering (computed from flat requirements)
export interface RequirementTreeNode extends Requirement {
  children: RequirementTreeNode[];
}

export interface UseCase {
  id: string;
  title: string;
  description: string;
  actor: string; // Who performs this use case
  preconditions: string;
  postconditions: string;
  mainFlow: string;
  alternativeFlows?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'draft' | 'approved' | 'implemented' | 'verified';
  lastModified: number;
  isDeleted?: boolean;
  deletedAt?: number;
  revision: string;
}

export interface TestCase {
  id: string;
  title: string;
  description: string;
  requirementIds: string[]; // Which requirements this test verifies
  status: 'draft' | 'approved' | 'passed' | 'failed' | 'blocked';
  priority: 'low' | 'medium' | 'high';
  author?: string;
  lastRun?: number;
  dateCreated: number;
  lastModified: number;
  isDeleted?: boolean;
  deletedAt?: number;
  revision: string;
}

export interface Information {
  id: string;
  title: string;
  content: string;
  type: 'note' | 'meeting' | 'decision' | 'other';
  dateCreated: number;
  lastModified: number;
  isDeleted?: boolean;
  deletedAt?: number;
  revision: string;
}

export interface Link {
  id: string;
  sourceId: string;
  targetId: string;
  targetProjectId?: string; // If missing, assumes current project
  sourceProjectId?: string; // If missing, assumes current project
  type: 'relates_to' | 'depends_on' | 'conflicts_with';
  description?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  requirementIds: string[];
  useCaseIds: string[];
  testCaseIds: string[];
  informationIds: string[];
  baselines?: string[]; // IDs of baselines for this project
  currentBaseline?: string; // ID of current baseline
  // Links are now global, so we don't strictly need them here,
  // but keeping a reference might be useful for project-specific views if we ever want to scope them tightly.
  // For now, let's remove them from Project as per plan, or keep them as IDs if we want "Project owns these links".
  // The plan said "Links are now global", implying they exist outside of projects.
  // However, usually links belong to the artifacts they link.
  // Let's keep it simple: Links are global. We can derive relevant links by checking if source/target is in the project.
  lastModified: number;
}

export interface GlobalState {
  requirements: Requirement[];
  useCases: UseCase[];
  testCases: TestCase[];
  information: Information[];
  links: Link[];
}

export interface ColumnVisibility {
  idTitle: boolean; // Always true, not user-configurable
  description: boolean;
  text: boolean; // Requirement Text
  rationale: boolean;
  author: boolean;
  verification: boolean;
  priority: boolean;
  status: boolean;
  comments: boolean;
  created: boolean;
  approved: boolean;
}

export type ViewType =
  | 'tree'
  | 'detailed'
  | 'matrix'
  | 'usecases'
  | 'testcases'
  | 'information'
  | 'baselines'
  | 'baseline-history'
  | 'library-requirements'
  | 'library-usecases'
  | 'library-testcases'
  | 'library-information';

// Git Revision Control Types

export interface ArtifactChange {
  id: string;
  type: 'requirement' | 'usecase' | 'testcase' | 'information';
  title: string;
  status: 'new' | 'modified'; // No 'deleted' - artifacts can only be removed from projects
  path: string;
  commitMessage?: string; // User's pending commit message
}

export interface ArtifactRevision {
  commitHash: string;
  message: string;
  author: string;
  timestamp: number;
}

export interface CommitInfo {
  hash: string;
  message: string;
  author: string;
  timestamp: number;
}

export interface ProjectBaseline {
  id: string;
  projectId: string;
  version: string; // e.g., "01", "02", "03"
  name: string;
  description: string;
  timestamp: number;
  // Snapshot of which artifacts are in the project at this baseline
  artifactCommits: {
    [artifactId: string]: {
      commitHash: string;
      type: 'requirement' | 'usecase' | 'testcase' | 'information';
    };
  };
  // Track what was added/removed from project since last baseline
  addedArtifacts?: string[];
  removedArtifacts?: string[];
}
