import type { CustomAttributeValue } from './customAttributes';
import type { ArtifactLink } from './link';

export type ArtifactType =
  | 'requirements'
  | 'useCases'
  | 'testCases'
  | 'information'
  | 'risks'
  | 'documents'
  | 'workflows';

export interface BaseArtifact {
  id: string;
  lastModified: number;
  revision: string;
  isDeleted?: boolean;
  deletedAt?: number;
  customAttributes?: CustomAttributeValue[];
  linkedArtifacts?: ArtifactLink[];
}

export interface DocumentEntry {
  type: 'heading' | 'artifact';
  id?: string; // id of the artifact if type === 'artifact'
  artifactType?: ArtifactType; // type of the artifact
  title?: string; // custom title OR heading text
  level?: number; // 1, 2, 3... for headings
}

export interface ArtifactDocument extends BaseArtifact {
  title: string;
  description?: string;
  projectId: string;
  structure: DocumentEntry[];
  dateCreated: number;
  author?: string;
  status?: string;
}

export interface Requirement extends BaseArtifact {
  title: string;
  text: string;
  description?: string;
  rationale?: string;
  comments?: string;
  status?: string;
  priority?: string;
  category?: string;
  dateCreated: number;
  verificationMethod?: string;
  approvalDate?: number;
  author?: string;
  useCaseIds?: string[];
}

export interface UseCase extends BaseArtifact {
  title: string;
  description: string;
  status?: string;
  priority?: string;
  actor?: string;
  precondition?: string;
  postcondition?: string;
  preconditions?: string;
  postconditions?: string;
  mainFlow?: string;
  alternativeFlows?: string;
  dateCreated?: number;
  useCaseIds?: string[];
  author?: string;
}

export interface TestCase extends BaseArtifact {
  title: string;
  description: string;
  status?: string;
  priority?: string;
  steps?: string;
  expectedResult?: string;
  dateCreated: number;
  lastRun?: number;
  author?: string;
  requirementIds?: string[];
}

export interface Information extends BaseArtifact {
  id: string;
  title: string;
  description?: string;
  text?: string;
  content?: string;
  type?: string;
  status?: string;
  author?: string;
  dateCreated: number;
  lastModified: number;
  isDeleted?: boolean;
  deletedAt?: number;
  revision: string;
  customAttributes?: CustomAttributeValue[];
  linkedArtifacts?: ArtifactLink[];
}

export interface Risk extends BaseArtifact {
  title: string;
  description: string;
  probability?: string;
  impact?: string;
  mitigation: string;
  category?: string;
  contingency?: string;
  owner?: string;
  author?: string;
  status?: string;
  dateCreated: number;
}

export interface Workflow extends BaseArtifact {
  title: string;
  description: string;
  type?: string;
  status?: string;
  assignedTo?: string;
  createdBy?: string;
  linkedArtifacts?: ArtifactLink[];
  artifactIds?: string[];
  history?: WorkflowAction[];
  dateCreated: number;
  approvedBy?: string;
  approvalDate?: number;
  approverComment?: string;
}

export interface WorkflowAction {
  id: string;
  type?: string;
  user?: string;
  timestamp?: number;
  comment?: string;
  metadata?: Record<string, unknown>;
}
