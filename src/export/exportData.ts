/**
 * What every export reads: the project as it was at a baseline (or as it is
 * now), and the questions PDF, Excel and JSON all ask of it. Everything is
 * derived from the kind registry and the links, so a kind or a field that is
 * added later is exported without touching this folder.
 */
import { ARTIFACT_KINDS, kind, type ArtifactKindId } from '../domain/artifactKinds';
import { getFieldValue, type FieldDef } from '../domain/fields';
import { formatFieldValue } from '../domain/formatFieldValue';
import { idNumber } from '../domain/ids';
import { isSymmetricType, linkLabelFrom } from '../domain/linkTypes';
import type { BaseArtifact, CommitInfo, Link, Project, ProjectBaseline } from '../types';
import type { CustomAttributeDefinition } from '../types/customAttributes';

/** The project an export is made from */
export interface ExportSource {
  project: Project;
  /** Every artifact, deleted ones included; see `exported` */
  artifacts: Record<ArtifactKindId, BaseArtifact[]>;
  links: Link[];
  attributeDefinitions: CustomAttributeDefinition[];
  /** The baseline exported, or null for the working copy */
  baseline: ProjectBaseline | null;
  /** Every baseline, newest first; the revision history is measured against them */
  baselines: ProjectBaseline[];
  exportedBy?: string;
  /** Commits that changed one artifact, newest first */
  history: (kindId: ArtifactKindId, id: string) => Promise<CommitInfo[]>;
  /** An image the markdown refers to (`./assets/x.png`) as it was at the baseline, or null */
  readAsset: (path: string) => Promise<Uint8Array | null>;
}

export interface ExportOptions {
  format: 'pdf' | 'excel' | 'json';
  /** null: the working copy */
  baseline: ProjectBaseline | null;
  /** The kinds to include; JSON always has every kind */
  kinds: ArtifactKindId[];
  links: boolean;
  /** Commits since the previous baseline (PDF section, Excel sheet) */
  revisionHistory: boolean;
  /** Excel: a sheet with every artifact against every other */
  traceabilityMatrix: boolean;
  /** Excel: a worksheet of requirements and the test cases that verify them */
  verificationMatrix: boolean;
}

export const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  format: 'pdf',
  baseline: null,
  kinds: ARTIFACT_KINDS.map((k) => k.id),
  links: true,
  revisionHistory: true,
  traceabilityMatrix: true,
  verificationMatrix: false,
};

/** Artifacts by ID number: REQ-2 before REQ-10 */
export function byId<T extends { id: string }>(items: readonly T[]): T[] {
  const n = (id: string) => idNumber(id.slice(0, id.indexOf('-')), id) ?? 0;
  return [...items].sort((a, b) => n(a.id) - n(b.id) || a.id.localeCompare(b.id));
}

/** The artifacts of a kind that are exported: not deleted, in ID order */
export function exported(source: Pick<ExportSource, 'artifacts'>, kindId: ArtifactKindId) {
  return byId(source.artifacts[kindId].filter((a) => !a.isDeleted));
}

/** The links that are exported: not deleted, in ID order */
export function exportedLinks(source: Pick<ExportSource, 'links'>): Link[] {
  return byId(source.links.filter((l) => !l.isDeleted));
}

/** A field's value as a reader sees it, '' when empty */
export function fieldDisplay(item: object, field: FieldDef): string {
  return formatFieldValue(field, getFieldValue(item, field));
}

/** One way an artifact relates to others: "Verifies" REQ-001, REQ-002 */
export interface Relation {
  label: string;
  ids: string[];
}

/**
 * How an artifact relates to others, read from its end of each link:
 * "TC-001 verifies REQ-001" is "Verifies REQ-001" on the test case and
 * "Verified by TC-001" on the requirement. Sorted by label.
 */
export function relationsOf(links: readonly Link[], id: string): Relation[] {
  const byLabel = new Map<string, Set<string>>();
  const add = (label: string, other: string) => {
    if (!byLabel.has(label)) byLabel.set(label, new Set());
    byLabel.get(label)!.add(other);
  };
  for (const link of links) {
    if (link.isDeleted) continue;
    if (link.sourceId === id) add(linkLabelFrom(link.type, 'source'), link.targetId);
    else if (link.targetId === id) {
      add(
        isSymmetricType(link.type)
          ? linkLabelFrom(link.type, 'source')
          : linkLabelFrom(link.type, 'target'),
        link.sourceId
      );
    }
  }
  return [...byLabel.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, ids]) => ({ label, ids: [...ids].sort() }));
}

/** The relation labels used by any exported artifact of a kind, sorted */
export function relationLabels(
  source: Pick<ExportSource, 'artifacts' | 'links'>,
  kindId: ArtifactKindId
): string[] {
  const links = exportedLinks(source);
  const labels = new Set<string>();
  for (const a of exported(source, kindId)) {
    for (const r of relationsOf(links, a.id)) labels.add(r.label);
  }
  return [...labels].sort();
}

/** "My Project" -> "My_Project", for file names */
export const safeFileName = (name: string) => name.replace(/[^a-z0-9]/gi, '_');

/** The label of what was exported: the baseline name or "Current State" */
export const stateLabel = (baseline: ProjectBaseline | null) =>
  baseline ? `Baseline ${baseline.name}` : 'Current State';

export const kindLabel = (kindId: ArtifactKindId) => kind(kindId).label.plural;
