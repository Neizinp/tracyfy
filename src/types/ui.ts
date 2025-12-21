import type { ProjectBaseline } from './git';

export interface ColumnVisibility {
  idTitle: boolean;
  text: boolean;
  description: boolean;
  priority: boolean;
  status: boolean;
  category: boolean;
  created: boolean;
  revision: boolean;
  projects: boolean;
  author: boolean;
  [key: string]: boolean | undefined;
}

export interface UseCaseColumnVisibility {
  idTitle: boolean;
  description: boolean;
  actor: boolean;
  priority: boolean;
  status: boolean;
  created: boolean;
  revision: boolean;
  projects: boolean;
  author: boolean;
  [key: string]: boolean | undefined;
}

export interface TestCaseColumnVisibility {
  idTitle: boolean;
  description: boolean;
  priority: boolean;
  status: boolean;
  requirements: boolean;
  created: boolean;
  revision: boolean;
  projects: boolean;
  author: boolean;
  [key: string]: boolean | undefined;
}

export interface InformationColumnVisibility {
  idTitle: boolean;
  description: boolean;
  type: boolean;
  status: boolean;
  author: boolean;
  created: boolean;
  revision: boolean;
  projects: boolean;
  [key: string]: boolean | undefined;
}

export interface RiskColumnVisibility {
  idTitle: boolean;
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
  projects: boolean;
  author: boolean;
  [key: string]: boolean | undefined;
}

export interface DocumentColumnVisibility {
  idTitle: boolean; // Always true
  description: boolean;
  structure: boolean;
  created: boolean;
  revision: boolean;
  projects: boolean;
  author: boolean;
  status: boolean;
  [key: string]: boolean | undefined;
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
