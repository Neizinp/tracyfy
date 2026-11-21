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
