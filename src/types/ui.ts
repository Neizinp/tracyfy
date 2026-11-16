import type { ProjectBaseline } from './git';
import type { ArtifactKindId } from '../domain/artifactKinds';

export interface ColumnVisibility {
  idTitle: boolean;
  text: boolean;
  description: boolean;
  priority: boolean;
  status: boolean;
  category: boolean;
  created: boolean;
  revision: boolean;
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
  author: boolean;
  [key: string]: boolean | undefined;
}

export interface DocumentColumnVisibility {
  idTitle: boolean; // Always true
  description: boolean;
  structure: boolean;
  created: boolean;
  revision: boolean;
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
  | 'baseline-history';

export type ModalType =
  | ArtifactKindId
  | 'project-settings'
  | 'user-settings'
  | 'onboarding'
  | 'link'
  | 'export'
  | 'history'
  | 'search'
  | 'custom-attribute'
  | 'workflow'
  | null;

export interface ActiveModal {
  type: ModalType;
  isEdit?: boolean;
}

export interface SelectedArtifact {
  id: string;
  type: ArtifactKindId;
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
