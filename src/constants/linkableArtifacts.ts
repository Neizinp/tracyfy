/**
 * Every artifact type that can take part in a link, defined once.
 * The link dialog, the Links page and traceability all derive from this list,
 * so a new artifact type becomes linkable by adding it here.
 */
export type LinkableType =
  | 'requirement'
  | 'usecase'
  | 'testcase'
  | 'information'
  | 'risk'
  | 'document';

export interface LinkableArtifact {
  id: string;
  title: string;
  description?: string;
  isDeleted?: boolean;
}

export type ArtifactsByType = Record<LinkableType, LinkableArtifact[]>;

export interface LinkableTypeInfo {
  type: LinkableType;
  /** Short tag shown on chips and type pickers */
  short: string;
  /** Plural, human-readable name */
  label: string;
  idPrefix: string;
  color: string;
}

export const LINKABLE_TYPES: readonly LinkableTypeInfo[] = [
  {
    type: 'requirement',
    short: 'REQ',
    label: 'Requirements',
    idPrefix: 'REQ',
    color: 'var(--color-info)',
  },
  {
    type: 'usecase',
    short: 'UC',
    label: 'Use Cases',
    idPrefix: 'UC',
    color: 'var(--color-accent-light)',
  },
  {
    type: 'testcase',
    short: 'TC',
    label: 'Test Cases',
    idPrefix: 'TC',
    color: 'var(--color-success)',
  },
  {
    type: 'information',
    short: 'INFO',
    label: 'Information',
    idPrefix: 'INFO',
    color: 'var(--color-warning)',
  },
  { type: 'risk', short: 'RISK', label: 'Risks', idPrefix: 'RISK', color: 'var(--color-error)' },
  {
    type: 'document',
    short: 'DOC',
    label: 'Documents',
    idPrefix: 'DOC',
    color: 'var(--color-text-secondary)',
  },
];

export const EMPTY_ARTIFACTS_BY_TYPE: ArtifactsByType = {
  requirement: [],
  usecase: [],
  testcase: [],
  information: [],
  risk: [],
  document: [],
};

export function linkableTypeInfo(type: LinkableType): LinkableTypeInfo {
  return LINKABLE_TYPES.find((t) => t.type === type)!;
}

/** Type of an artifact from its ID prefix (e.g. "RISK-003" -> 'risk') */
export function linkableTypeOf(id: string): LinkableType | undefined {
  const prefix = id.split('-')[0];
  return LINKABLE_TYPES.find((t) => t.idPrefix === prefix)?.type;
}
