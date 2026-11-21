/**
 * The JSON export: the whole project as data, keyed by kind ID, and its
 * import. Export → import into an empty folder gives the same project.
 *
 *   { "project": {...}, "artifacts": { "requirement": [...], ... },
 *     "links": [...], "baseline": "1.0" | null, "exportedAt": "..." }
 */
import { ARTIFACT_KINDS, kindRecord, type ArtifactKindId } from '../domain/artifactKinds';
import type { BaseArtifact, Link } from '../types';
import { exported, exportedLinks, type ExportSource } from './exportData';
import { emptyBundle, validArtifacts, validLinks, type ImportBundle } from './importBundle';

export interface JsonExport {
  project: { name: string; description: string };
  artifacts: Record<ArtifactKindId, BaseArtifact[]>;
  links: Link[];
  /** The baseline exported, or null for the working copy */
  baseline: string | null;
  exportedAt: string;
}

export function buildJson(source: ExportSource, now = new Date()): JsonExport {
  return {
    project: { name: source.project.name, description: source.project.description },
    artifacts: kindRecord((k) => exported(source, k)),
    links: exportedLinks(source),
    baseline: source.baseline?.name ?? null,
    exportedAt: now.toISOString(),
  };
}

/**
 * Read a JSON export. Rows that are not valid are left out and reported.
 * @throws when the text is not JSON or not an export object
 */
export function parseJson(text: string): ImportBundle {
  const json: unknown = JSON.parse(text);
  if (typeof json !== 'object' || json === null || Array.isArray(json)) {
    throw new Error('The file does not contain a project export');
  }
  const data = json as { artifacts?: unknown; links?: unknown };
  const bundle = emptyBundle();
  const artifacts = (
    typeof data.artifacts === 'object' && data.artifacts !== null ? data.artifacts : {}
  ) as Record<string, unknown>;
  for (const k of ARTIFACT_KINDS) {
    bundle.artifacts[k.id] = validArtifacts(k.id, artifacts[k.id], bundle.skipped);
  }
  bundle.links = validLinks(data.links, bundle.skipped);
  return bundle;
}
