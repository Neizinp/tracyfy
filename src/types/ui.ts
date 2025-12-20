import type { ProjectBaseline } from './git';

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
  description: boolean;
  actor: boolean;
  priority: boolean;
  status: boolean;
  preconditions: boolean;
  mainFlow: boolean;
  alternativeFlows: boolean;
  postconditions: boolean;
  revision: boolean;
}

export interface TestCaseColumnVisibility {
  idTitle: boolean; // Always true
  description: boolean;
  requirements: boolean;
  priority: boolean;
  status: boolean;
  author: boolean;
  lastRun: boolean;
  created: boolean;
  revision: boolean;
}

export interface InformationColumnVisibility {
  idTitle: boolean; // Always true
  type: boolean;
  text: boolean;
  created: boolean;
  revision: boolean;
}

export interface RiskColumnVisibility {
  idTitle: boolean; // Always true
  description: boolean;
  category: boolean;
  probability: boolean;
  impact: boolean;
  status: boolean;
  owner: boolean;
  mitigation: boolean;
  contingency: boolean;
  created: boolean;
  revision: boolean;
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

export type ModalType =
  | 'requirement'
  | 'usecase'
  | 'testcase'
  | 'information'
  | 'risk'
  | 'project'
  | 'project-settings'
  | 'user-settings'
  | 'onboarding'
  | 'link'
  | 'export'
  | 'history'
  | 'search'
  | 'custom-attribute'
  | 'workflow'
  | 'global-library'
  | 'documents'
  | null;

export interface ActiveModal {
  type: ModalType;
  isEdit?: boolean;
}

export interface SelectedArtifact {
  id: string;
  type:
    | 'requirement'
    | 'usecase'
    | 'testcase'
    | 'information'
    | 'risk'
    | 'project'
    | 'user'
    | 'documents';
  data?: Record<string, unknown>;
}

export interface ExportOptions {
  format: 'pdf' | 'excel' | 'json';
  baseline: ProjectBaseline | null;
  // Artifact types
  includeRequirements: boolean;
  includeUseCases: boolean;
  includeTestCases: boolean;
  includeInformation: boolean;
  includeRisks: boolean;
  includeDocuments: boolean;
  includeLinks: boolean;
  // PDF-specific sections
  includeTitlePage: boolean;
  includeRevisionHistory: boolean;
  includeTraceability: boolean;
  includeVerificationMatrix: boolean;
}
