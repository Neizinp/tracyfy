import type { Gap } from '../../domain/traceability';
import type { ArtifactKindId } from '../../domain/artifactKinds';

export interface UnifiedArtifact {
  id: string;
  title: string;
  type: ArtifactKindId;
}

export type IssueType = Gap['issue'];

/** A gap, with the artifact it is about */
export interface GapInfo {
  artifact: UnifiedArtifact;
  gap: Gap;
}

export interface LinkInfo {
  sourceId: string;
  targetId: string;
  type: string;
  sourceType: ArtifactKindId;
  targetType: ArtifactKindId;
}

export const ISSUE_COLORS: Record<IssueType, string> = {
  coverage: 'var(--color-warning-light)',
  not_allowed: 'var(--color-info-light, #60a5fa)',
  orphan_link: 'var(--color-error-light, #f87171)',
  suspect: 'var(--color-warning)',
};

/** What the gap list says about a gap */
export function gapLabel(gap: Gap): { label: string; details?: string } {
  switch (gap.issue) {
    case 'coverage':
      return { label: gap.rule };
    case 'not_allowed':
      return { label: 'Link not allowed by the rules', details: gap.linkId };
    case 'orphan_link':
      return { label: 'Orphan link', details: `${gap.linkId} → ${gap.missingId}` };
    case 'suspect':
      return { label: 'Suspect link', details: `${gap.changedId} changed (${gap.linkId})` };
  }
}
