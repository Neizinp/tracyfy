import type { ArtifactLink } from '../../types';

export type ArtifactType =
  | 'requirement'
  | 'useCase'
  | 'testCase'
  | 'information'
  | 'risk'
  | 'document';

/** Every artifact type traceability covers, in display order */
export const TRACE_TYPES: { type: ArtifactType; short: string; label: string }[] = [
  { type: 'useCase', short: 'UC', label: 'Use Cases' },
  { type: 'requirement', short: 'REQ', label: 'Requirements' },
  { type: 'testCase', short: 'TC', label: 'Test Cases' },
  { type: 'information', short: 'INFO', label: 'Information' },
  { type: 'risk', short: 'RISK', label: 'Risks' },
  { type: 'document', short: 'DOC', label: 'Documents' },
];

export const ALL_TRACE_TYPES: ArtifactType[] = TRACE_TYPES.map((t) => t.type);

/** Artifact type from an ID prefix (REQ-001 -> requirement), or undefined */
export function traceTypeOf(id: string): ArtifactType | undefined {
  const prefix = id.split('-')[0];
  return TRACE_TYPES.find((t) => t.short === prefix)?.type;
}

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
    bg: 'var(--color-info-bg)',
    border: 'rgba(59, 130, 246, 0.5)',
    text: 'var(--color-info)',
  },
  useCase: {
    bg: 'rgba(139, 92, 246, 0.1)',
    border: 'rgba(139, 92, 246, 0.5)',
    text: 'var(--color-accent-light)',
  },
  testCase: {
    bg: 'rgba(34, 197, 94, 0.1)',
    border: 'rgba(34, 197, 94, 0.5)',
    text: 'var(--color-success)',
  },
  information: { bg: 'rgba(234, 179, 8, 0.1)', border: 'rgba(234, 179, 8, 0.5)', text: '#eab308' },
  risk: {
    bg: 'rgba(239, 68, 68, 0.1)',
    border: 'rgba(239, 68, 68, 0.5)',
    text: 'var(--color-error)',
  },
  document: {
    bg: 'rgba(148, 163, 184, 0.1)',
    border: 'rgba(148, 163, 184, 0.5)',
    text: 'var(--color-text-secondary)',
  },
};

export const ISSUE_LABELS: Record<IssueType, { label: string; color: string }> = {
  unlinked: { label: 'No links', color: 'var(--color-warning-light)' },
  no_outgoing: { label: 'No outgoing links', color: 'var(--color-warning-light)' },
  no_incoming: { label: 'No incoming links', color: 'var(--color-info-light, #60a5fa)' },
  orphan_link: { label: 'Orphan link', color: 'var(--color-error-light, #f87171)' },
};
