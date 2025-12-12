import type { ArtifactLink } from '../../types';

export type ArtifactType = 'requirement' | 'useCase' | 'testCase' | 'information';

export interface UnifiedArtifact {
  id: string;
  title: string;
  type: ArtifactType;
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
  sourceType: ArtifactType;
  targetType: ArtifactType;
}

export const TYPE_COLORS: Record<ArtifactType, { bg: string; border: string; text: string }> = {
  requirement: {
    bg: 'rgba(59, 130, 246, 0.1)',
    border: 'rgba(59, 130, 246, 0.5)',
    text: '#3b82f6',
  },
  useCase: { bg: 'rgba(139, 92, 246, 0.1)', border: 'rgba(139, 92, 246, 0.5)', text: '#8b5cf6' },
  testCase: { bg: 'rgba(34, 197, 94, 0.1)', border: 'rgba(34, 197, 94, 0.5)', text: '#22c55e' },
  information: { bg: 'rgba(234, 179, 8, 0.1)', border: 'rgba(234, 179, 8, 0.5)', text: '#eab308' },
};

export const ISSUE_LABELS: Record<IssueType, { label: string; color: string }> = {
  unlinked: { label: 'No links', color: 'var(--color-warning-light)' },
  no_outgoing: { label: 'No outgoing links', color: 'var(--color-warning-light)' },
  no_incoming: { label: 'No incoming links', color: 'var(--color-info-light, #60a5fa)' },
  orphan_link: { label: 'Orphan link', color: 'var(--color-error-light, #f87171)' },
};
