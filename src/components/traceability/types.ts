import type { ArtifactLink } from '../../types';
import type { ArtifactKindId } from '../../domain/artifactKinds';

export interface UnifiedArtifact {
  id: string;
  title: string;
  type: ArtifactKindId;
  linkedArtifacts: ArtifactLink[];
}

export type IssueType = 'no_outgoing' | 'no_incoming' | 'orphan_link' | 'unlinked';

export interface GapInfo {
  artifact: UnifiedArtifact;
  issueType: IssueType;
  details?: string;
}

export interface LinkInfo {
  sourceId: string;
  targetId: string;
  type: string;
  sourceType: ArtifactKindId;
  targetType: ArtifactKindId;
}

export const ISSUE_LABELS: Record<IssueType, { label: string; color: string }> = {
  unlinked: { label: 'No links', color: 'var(--color-warning-light)' },
  no_outgoing: { label: 'No outgoing links', color: 'var(--color-warning-light)' },
  no_incoming: { label: 'No incoming links', color: 'var(--color-info-light, #60a5fa)' },
  orphan_link: { label: 'Orphan link', color: 'var(--color-error-light, #f87171)' },
};
