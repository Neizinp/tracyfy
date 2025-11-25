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
}

export interface Link {
  id: string;
  sourceId: string;
  targetId: string;
  type: 'relates_to' | 'depends_on' | 'conflicts_with';
  description?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  requirements: Requirement[];
  useCases: UseCase[];
  testCases: TestCase[];
  information: Information[];
  links: Link[];
  lastModified: number;
}

export interface Version {
  id: string;
  timestamp: number;
  message: string;
  type: 'auto-save' | 'baseline';
  tag?: string;
  data: {
    requirements: Requirement[];
    useCases: UseCase[];
    links: Link[];
    testCases: TestCase[];
    information: Information[];
  };
}

export interface ColumnVisibility {
  idTitle: boolean;       // Always true, not user-configurable
  description: boolean;
  text: boolean;          // Requirement Text
  rationale: boolean;
  author: boolean;
  verification: boolean;
  priority: boolean;
  status: boolean;
  comments: boolean;
  created: boolean;
  approved: boolean;
}
