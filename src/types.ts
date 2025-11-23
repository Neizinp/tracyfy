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
  lastModified: number;
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
  links: Link[];
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
  };
}
