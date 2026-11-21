import type { CustomAttributeValue } from './customAttributes';
import type { ArtifactKindId } from '../domain/artifactKinds';

export interface BaseArtifact {
  id: string;
  lastModified: number;
  revision: string;
  isDeleted?: boolean;
  deletedAt?: number;
  customAttributes?: CustomAttributeValue[];
}

export interface DocumentEntry {
  type: 'heading' | 'artifact';
  id?: string; // id of the artifact if type === 'artifact'
  artifactType?: ArtifactKindId;
  title?: string; // custom title OR heading text
  level?: number; // 1, 2, 3... for headings
}

export interface ArtifactDocument extends BaseArtifact {
  title: string;
  description?: string;
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
}

export interface UseCase extends BaseArtifact {
  title: string;
  description: string;
  status?: string;
  priority?: string;
  actor?: string;
  preconditions?: string;
  postconditions?: string;
  mainFlow?: string;
  alternativeFlows?: string;
  dateCreated?: number;
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
}

export interface Information extends BaseArtifact {
  id: string;
  title: string;
  description?: string;
  text?: string;
  type?: string;
  status?: string;
  author?: string;
  dateCreated: number;
  lastModified: number;
  isDeleted?: boolean;
  deletedAt?: number;
  revision: string;
  customAttributes?: CustomAttributeValue[];
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
