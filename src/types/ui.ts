import type { ProjectBaseline } from './git';
import type { ArtifactKindId } from '../domain/artifactKinds';

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
