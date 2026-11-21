/**
 * What an import hands to the app: artifacts by kind and links, each one
 * checked by the same codec that reads the project's files, so an imported
 * artifact is exactly what the app would have read from disk.
 *
 * Imported IDs become file names (`<folder>/<id>.md`), so they are checked
 * strictly as well: no dots, no slashes.
 */
import { ARTIFACT_KINDS, kindRecord, type ArtifactKindId } from '../domain/artifactKinds';
import {
  parseArtifact,
  parseLink,
  serializeArtifact,
  serializeLink,
} from '../domain/artifactFormat';
import type { BaseArtifact, Link } from '../types';

/** Letters, digits, '-' and '_' only; must start with a letter */
export const ARTIFACT_ID_PATTERN = /^[A-Za-z][A-Za-z0-9_-]{0,63}$/;

export const isValidArtifactId = (id: unknown): id is string =>
  typeof id === 'string' && ARTIFACT_ID_PATTERN.test(id);

export interface SkippedRow {
  /** The kind's plural label, or "Links" */
  where: string;
  /** Row number in the file, from 1 */
  row: number;
  reason: string;
}

export interface ImportBundle {
  artifacts: Record<ArtifactKindId, BaseArtifact[]>;
  links: Link[];
  skipped: SkippedRow[];
}

export const emptyBundle = (): ImportBundle => ({
  artifacts: kindRecord(() => []),
  links: [],
  skipped: [],
});

const message = (err: unknown) => (err instanceof Error ? err.message : String(err));

/**
 * The rows that are valid artifacts of a kind; the others are reported in
 * `skipped`. A row must have a valid, unique ID and a title.
 */
export function validArtifacts(
  kindId: ArtifactKindId,
  rows: unknown,
  skipped: SkippedRow[]
): BaseArtifact[] {
  const where = ARTIFACT_KINDS.find((k) => k.id === kindId)!.label.plural;
  if (rows === undefined || rows === null) return [];
  if (!Array.isArray(rows)) {
    skipped.push({ where, row: 0, reason: 'not a list' });
    return [];
  }
  const seen = new Set<string>();
  const valid: BaseArtifact[] = [];
  rows.forEach((row: unknown, i) => {
    const skip = (reason: string) => skipped.push({ where, row: i + 1, reason });
    if (typeof row !== 'object' || row === null || Array.isArray(row)) return skip('not an object');
    const r = row as Record<string, unknown>;
    if (!isValidArtifactId(r.id)) return skip(`invalid ID ${JSON.stringify(r.id ?? null)}`);
    if (typeof r.title !== 'string' || r.title.trim() === '') return skip(`${r.id}: no title`);
    if (seen.has(r.id)) return skip(`${r.id}: the ID appears twice`);
    try {
      valid.push(parseArtifact(kindId, r.id, serializeArtifact(kindId, r as never)));
      seen.add(r.id);
    } catch (err) {
      skip(`${r.id}: ${message(err)}`);
    }
  });
  return valid;
}

/** The rows that are valid links; a link needs valid IDs for itself and both ends */
export function validLinks(rows: unknown, skipped: SkippedRow[]): Link[] {
  const where = 'Links';
  if (rows === undefined || rows === null) return [];
  if (!Array.isArray(rows)) {
    skipped.push({ where, row: 0, reason: 'not a list' });
    return [];
  }
  const seen = new Set<string>();
  const valid: Link[] = [];
  rows.forEach((row: unknown, i) => {
    const skip = (reason: string) => skipped.push({ where, row: i + 1, reason });
    const l = (typeof row === 'object' && row !== null ? row : {}) as Record<string, unknown>;
    if (
      !isValidArtifactId(l.id) ||
      !isValidArtifactId(l.sourceId) ||
      !isValidArtifactId(l.targetId)
    )
      return skip(`invalid link ${JSON.stringify(l.id ?? null)}`);
    if (seen.has(l.id)) return skip(`${l.id}: the ID appears twice`);
    try {
      valid.push(parseLink(l.id, serializeLink(l as unknown as Link)));
      seen.add(l.id);
    } catch (err) {
      skip(`${l.id}: ${message(err)}`);
    }
  });
  return valid;
}

/** How many artifacts and links the bundle holds */
export function countImported(bundle: ImportBundle): number {
  return Object.values(bundle.artifacts).reduce((n, a) => n + a.length, 0) + bundle.links.length;
}

/** The first few skipped rows, as one line for a toast */
export function describeSkipped(skipped: readonly SkippedRow[], limit = 3): string {
  if (skipped.length === 0) return '';
  const reasons = skipped
    .slice(0, limit)
    .map((s) => `${s.where}${s.row ? ` row ${s.row}` : ''}: ${s.reason}`);
  const more = skipped.length > limit ? ` (+${skipped.length - limit} more)` : '';
  return `Skipped ${skipped.length} invalid row(s): ${reasons.join('; ')}${more}`;
}
