/**
 * The artifact kind registry: one definition per kind of artifact.
 *
 * This is the only place that knows which kinds exist. Identifiers, ID prefixes,
 * folders, labels and colors are all looked up here, so a feature that should
 * cover "every artifact" iterates ARTIFACT_KINDS instead of listing kinds by hand.
 *
 * Pure TypeScript: no React, no IO.
 */

export const KIND_IDS = [
  'requirement',
  'useCase',
  'testCase',
  'information',
  'risk',
  'document',
] as const;

/** The one identifier for a kind of artifact */
export type ArtifactKindId = (typeof KIND_IDS)[number];

export interface KindColors {
  /** Text and icon color */
  text: string;
  /** Subtle background for chips and badges */
  bg: string;
  /** Border for chips and nodes */
  border: string;
}

export interface ArtifactKind {
  id: ArtifactKindId;
  /** ID prefix and short tag on chips: REQ in REQ-001 */
  prefix: string;
  /** Folder in the project that holds one file per artifact */
  folder: string;
  label: { singular: string; plural: string };
  color: KindColors;
}

function colors(token: string): KindColors {
  return {
    text: `var(${token})`,
    bg: `color-mix(in srgb, var(${token}) 12%, transparent)`,
    border: `color-mix(in srgb, var(${token}) 50%, transparent)`,
  };
}

/** Every kind, in display order */
export const ARTIFACT_KINDS: readonly ArtifactKind[] = [
  {
    id: 'requirement',
    prefix: 'REQ',
    folder: 'requirements',
    label: { singular: 'Requirement', plural: 'Requirements' },
    color: colors('--color-info'),
  },
  {
    id: 'useCase',
    prefix: 'UC',
    folder: 'usecases',
    label: { singular: 'Use Case', plural: 'Use Cases' },
    color: colors('--color-accent-light'),
  },
  {
    id: 'testCase',
    prefix: 'TC',
    folder: 'testcases',
    label: { singular: 'Test Case', plural: 'Test Cases' },
    color: colors('--color-success'),
  },
  {
    id: 'information',
    prefix: 'INFO',
    folder: 'information',
    label: { singular: 'Information', plural: 'Information' },
    color: colors('--color-warning'),
  },
  {
    id: 'risk',
    prefix: 'RISK',
    folder: 'risks',
    label: { singular: 'Risk', plural: 'Risks' },
    color: colors('--color-error'),
  },
  {
    id: 'document',
    prefix: 'DOC',
    folder: 'documents',
    label: { singular: 'Document', plural: 'Documents' },
    color: colors('--color-text-secondary'),
  },
];

const BY_ID = new Map(ARTIFACT_KINDS.map((k) => [k.id, k]));
const BY_PREFIX = new Map(ARTIFACT_KINDS.map((k) => [k.prefix, k]));
const BY_FOLDER = new Map(ARTIFACT_KINDS.map((k) => [k.folder, k]));

/** The definition of a kind */
export function kind(id: ArtifactKindId): ArtifactKind {
  const k = BY_ID.get(id);
  if (!k) throw new Error(`Unknown artifact kind: ${String(id)}`);
  return k;
}

export function isKindId(value: unknown): value is ArtifactKindId {
  return typeof value === 'string' && BY_ID.has(value as ArtifactKindId);
}

/** Kind of an artifact from its ID: "RISK-003" -> 'risk'. Undefined for non-artifact IDs. */
export function kindOfId(artifactId: string): ArtifactKindId | undefined {
  const dash = artifactId.indexOf('-');
  if (dash <= 0) return undefined;
  return BY_PREFIX.get(artifactId.slice(0, dash))?.id;
}

/** Kind whose files live in `folder`: "usecases" -> 'useCase' */
export function kindOfFolder(folder: string): ArtifactKindId | undefined {
  return BY_FOLDER.get(folder)?.id;
}

/** A record with one entry per kind, e.g. kindRecord(() => []) */
export function kindRecord<T>(make: (id: ArtifactKindId) => T): Record<ArtifactKindId, T> {
  return Object.fromEntries(KIND_IDS.map((id) => [id, make(id)])) as Record<ArtifactKindId, T>;
}
