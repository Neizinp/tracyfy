/**
 * The fingerprint of what an artifact says: its title and text fields.
 *
 * A link remembers the fingerprint of its target from when it was last
 * reviewed. When the target's content changes, the fingerprint no longer
 * matches and the link is suspect (DESIGN.md §3.3, P3). The same fingerprint
 * tells whether an edit changed the content of an approved artifact (§3.4).
 *
 * Status, priority, dates, the author and the revision are metadata, not
 * content: changing them leaves the fingerprint alone.
 *
 * Pure TypeScript: no React, no IO.
 */
import { kind, type ArtifactKindId } from './artifactKinds';
import { TITLE, type FieldDef } from './fields';

const isContent = (field: FieldDef) =>
  !field.readOnly && (field.type === 'text' || field.type === 'markdown');

const CONTENT_FIELDS = new Map<ArtifactKindId, FieldDef[]>();

/** The fields of a kind that make up its content */
export function contentFields(kindId: ArtifactKindId): FieldDef[] {
  let fields = CONTENT_FIELDS.get(kindId);
  if (!fields) {
    fields = [TITLE, ...kind(kindId).fields.filter(isContent)];
    CONTENT_FIELDS.set(kindId, fields);
  }
  return fields;
}

/** Whitespace at the ends and line ending style do not change what a text says */
const normalize = (v: unknown) =>
  typeof v === 'string' ? v.replace(/\r\n?/g, '\n').trim() : v == null ? '' : String(v);

/** FNV-1a, 32 bits: short, stable, and enough to notice a change */
function fnv1a(text: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/** The fingerprint of an artifact's content, as 8 hex digits */
export function fingerprint(kindId: ArtifactKindId, artifact: object): string {
  const item = artifact as Record<string, unknown>;
  const text = contentFields(kindId)
    .map((f) => `${f.id}\u0000${normalize(item[f.id])}`)
    .join('\u0001');
  return fnv1a(text);
}
