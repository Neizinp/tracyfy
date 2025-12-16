import type { CustomAttributeValue } from './types/customAttributes';

// Link stored within an artifact (DEPRECATED - use Link instead)
export interface ArtifactLink {
  targetId: string;
  type:
    | 'parent' // Hierarchical decomposition - this is a parent of target
    | 'child' // Hierarchical decomposition - this is a child of target
    | 'derived_from' // Logical derivation, not strict hierarchy
    | 'depends_on' // Dependency
    | 'conflicts_with' // Mutual exclusivity
    | 'duplicates' // Redundancy or overlap (Similar To)
    | 'refines' // Adds detail without changing intent
    | 'satisfies' // Links to design or implementation (Implements)
    | 'verifies' // Links to test cases or validation
    | 'constrains' // Imposes restrictions on another requirement
    | 'requires' // Precondition for another requirement
    | 'related_to'; // Generic association for context
}

// Standalone link entity stored in links/ folder
export interface Link {
  id: string; // LINK-001, LINK-002, etc.
  sourceId: string; // The artifact creating the link (e.g., REQ-001)
  targetId: string; // The artifact being linked to (e.g., UC-003)
  type: import('./utils/linkTypes').LinkType; // Link relationship type
  projectIds: string[]; // Empty = global (all projects), populated = project-specific
  dateCreated: number;
  lastModified: number;
  customAttributes?: CustomAttributeValue[];
}

export interface Requirement {
  id: string;
  title: string;
  description: string;
  text: string;
  rationale: string;
  useCaseIds?: string[]; // Which use cases this requirement supports
  linkedArtifacts?: ArtifactLink[]; // Links to other artifacts
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
  customAttributes?: CustomAttributeValue[];
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
  linkedArtifacts?: ArtifactLink[]; // Links to other artifacts
  priority: 'low' | 'medium' | 'high';
  status: 'draft' | 'approved' | 'implemented' | 'verified';
  lastModified: number;
  isDeleted?: boolean;
  deletedAt?: number;
  revision: string;
  customAttributes?: CustomAttributeValue[];
}

export interface TestCase {
  id: string;
  title: string;
  description: string;
  requirementIds: string[]; // Which requirements this test verifies
  linkedArtifacts?: ArtifactLink[]; // Links to other artifacts
  status: 'draft' | 'approved' | 'passed' | 'failed' | 'blocked';
  priority: 'low' | 'medium' | 'high';
  author?: string;
  lastRun?: number;
  dateCreated: number;
  lastModified: number;
  isDeleted?: boolean;
  deletedAt?: number;
  revision: string;
  customAttributes?: CustomAttributeValue[];
}

export interface Information {
  id: string;
  title: string;
  content: string;
  type: 'note' | 'meeting' | 'decision' | 'other';
  linkedArtifacts?: ArtifactLink[]; // Links to other artifacts
  dateCreated: number;
  lastModified: number;
  isDeleted?: boolean;
  deletedAt?: number;
  revision: string;
  customAttributes?: CustomAttributeValue[];
}

export interface Risk {
  id: string;
  title: string;
  description: string;
  category: 'technical' | 'schedule' | 'resource' | 'external' | 'other';
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  mitigation: string; // Mitigation strategy
  contingency: string; // Contingency plan
  status: 'identified' | 'analyzing' | 'mitigating' | 'resolved' | 'accepted';
  owner?: string; // Person responsible
  linkedArtifacts?: ArtifactLink[]; // Links to other artifacts
  dateCreated: number;
  lastModified: number;
  isDeleted?: boolean;
  deletedAt?: number;
  revision: string;
  customAttributes?: CustomAttributeValue[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  requirementIds: string[];
  useCaseIds: string[];
  testCaseIds: string[];
  informationIds: string[];
  riskIds: string[];
  baselines?: string[]; // IDs of baselines for this project
  currentBaseline?: string; // ID of current baseline
  isDeleted?: boolean; // Soft delete flag
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
  risks: Risk[];
}

export interface User {
  id: string; // e.g., "USER-001"
  name: string;
  dateCreated: number;
  lastModified: number;
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

export interface UseCaseColumnVisibility {
  idTitle: boolean; // Always true
  revision: boolean;
  description: boolean;
  actor: boolean;
  priority: boolean;
  status: boolean;
  preconditions: boolean;
  mainFlow: boolean;
  alternativeFlows: boolean;
  postconditions: boolean;
}

export interface TestCaseColumnVisibility {
  idTitle: boolean; // Always true
  revision: boolean;
  description: boolean;
  requirements: boolean;
  priority: boolean;
  status: boolean;
  author: boolean;
  lastRun: boolean;
  created: boolean;
}

export interface InformationColumnVisibility {
  idTitle: boolean; // Always true
  revision: boolean;
  type: boolean;
  content: boolean;
  created: boolean;
}

export interface RiskColumnVisibility {
  idTitle: boolean; // Always true
  revision: boolean;
  description: boolean;
  category: boolean;
  probability: boolean;
  impact: boolean;
  status: boolean;
  owner: boolean;
  mitigation: boolean;
  contingency: boolean;
  created: boolean;
}

export type ViewType =
  | 'tree'
  | 'detailed'
  | 'matrix'
  | 'usecases'
  | 'testcases'
  | 'information'
  | 'risks'
  | 'baselines'
  | 'baseline-history'
  | 'library-requirements'
  | 'library-usecases'
  | 'library-testcases'
  | 'library-information'
  | 'library-risks';

// Git Revision Control Types

export interface ArtifactChange {
  id: string;
  type: 'requirement' | 'usecase' | 'testcase' | 'information' | 'project' | 'asset' | 'risk';
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
