import type { CustomAttributeValue } from './customAttributes';
import type { ArtifactLink } from './link';

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
  text: string;
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
