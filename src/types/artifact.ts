import type { CustomAttributeValue } from './customAttributes';
import type { LinkType } from '../utils/linkTypes';

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
  type: LinkType; // Link relationship type
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

export interface Workflow {
  id: string; // e.g., "WF-001"
  title: string;
  description: string; // Markdown content
  createdBy: string; // User ID who created
  assignedTo: string; // User ID who must approve
  status: 'pending' | 'approved' | 'rejected';
  artifactIds: string[]; // Required: artifacts to approve (REQ-001, UC-002, etc.)
  approvedBy?: string; // User ID who approved
  approvalDate?: number;
  approverComment?: string; // Comment from approver
  dateCreated: number;
  lastModified: number;
  isDeleted?: boolean;
  deletedAt?: number;
  revision: string;
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
