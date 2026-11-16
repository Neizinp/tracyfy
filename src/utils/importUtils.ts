/**
 * Import parsing & validation
 *
 * Pure helpers that turn untrusted JSON / Excel content into artifacts that are
 * safe to persist. Imported IDs end up in file paths (`<folder>/<id>.md`), so
 * they are validated strictly to prevent path traversal or broken filenames.
 */

import type { WorkBook } from 'xlsx';
import type * as XLSXModule from 'xlsx';
import type {
  Requirement,
  UseCase,
  TestCase,
  Information,
  ArtifactDocument,
  Risk,
  Link,
} from '../types';

/** Letters, digits, '-' and '_' only; must start with a letter. No dots or slashes. */
export const ARTIFACT_ID_PATTERN = /^[A-Za-z][A-Za-z0-9_-]{0,63}$/;

export function isValidArtifactId(id: unknown): id is string {
  return typeof id === 'string' && ARTIFACT_ID_PATTERN.test(id);
}

export interface SkippedImportRow {
  kind: ImportKind | 'links';
  index: number;
  reason: string;
}

export type ImportKind =
  | 'requirements'
  | 'useCases'
  | 'testCases'
  | 'information'
  | 'risks'
  | 'documents';

export interface ImportBundle {
  requirements: Requirement[];
  useCases: UseCase[];
  testCases: TestCase[];
  information: Information[];
  risks: Risk[];
  documents: ArtifactDocument[];
  links: Link[];
  skipped: SkippedImportRow[];
}

export const IMPORT_KINDS: ImportKind[] = [
  'requirements',
  'useCases',
  'testCases',
  'information',
  'risks',
  'documents',
];

/**
 * Keep only rows that are objects with a valid, unique ID and a non-empty title.
 */
export function validateImportedArtifacts<T extends { id: string; title: string }>(
  rows: unknown,
  kind: ImportKind,
  skipped: SkippedImportRow[]
): T[] {
  if (rows === undefined || rows === null) return [];
  if (!Array.isArray(rows)) {
    skipped.push({ kind, index: -1, reason: `"${kind}" is not a list` });
    return [];
  }

  const seen = new Set<string>();
  const valid: T[] = [];

  rows.forEach((row, index) => {
    if (typeof row !== 'object' || row === null || Array.isArray(row)) {
      skipped.push({ kind, index, reason: 'not an object' });
      return;
    }
    const candidate = row as Record<string, unknown>;
    if (!isValidArtifactId(candidate.id)) {
      skipped.push({ kind, index, reason: `invalid ID ${JSON.stringify(candidate.id ?? null)}` });
      return;
    }
    if (typeof candidate.title !== 'string' || candidate.title.trim() === '') {
      skipped.push({ kind, index, reason: `${candidate.id}: missing title` });
      return;
    }
    if (seen.has(candidate.id)) {
      skipped.push({ kind, index, reason: `${candidate.id}: duplicate ID in file` });
      return;
    }
    seen.add(candidate.id);
    valid.push(candidate as unknown as T);
  });

  return valid;
}

/**
 * Parse a project JSON export.
 * @throws if the text is not valid JSON or not an object
 */
export function parseJsonImport(text: string): ImportBundle {
  const json: unknown = JSON.parse(text);
  if (typeof json !== 'object' || json === null || Array.isArray(json)) {
    throw new Error('File does not contain a project export object');
  }
  const data = json as Record<string, unknown>;
  const skipped: SkippedImportRow[] = [];

  return {
    requirements: validateImportedArtifacts<Requirement>(
      data.requirements,
      'requirements',
      skipped
    ),
    useCases: validateImportedArtifacts<UseCase>(data.useCases, 'useCases', skipped),
    testCases: validateImportedArtifacts<TestCase>(data.testCases, 'testCases', skipped),
    information: validateImportedArtifacts<Information>(data.information, 'information', skipped),
    risks: validateImportedArtifacts<Risk>(data.risks, 'risks', skipped),
    documents: validateImportedArtifacts<ArtifactDocument>(data.documents, 'documents', skipped),
    links: validateImportedLinks(data.links, skipped),
    skipped,
  };
}

const cell = (value: unknown): string =>
  value === undefined || value === null ? '' : String(value).trim();

/**
 * Parse an Excel workbook with "Requirements" and/or "Use Cases" sheets.
 */
export function parseExcelImport(
  workbook: WorkBook,
  xlsxUtils: typeof XLSXModule.utils,
  now: number = Date.now()
): ImportBundle {
  const skipped: SkippedImportRow[] = [];
  let requirements: Requirement[] = [];
  let useCases: UseCase[] = [];

  const reqSheet = workbook.Sheets['Requirements'];
  if (reqSheet) {
    const rows = xlsxUtils.sheet_to_json<Record<string, unknown>>(reqSheet);
    const mapped = rows.map((row) => ({
      id: cell(row['ID']),
      title: cell(row['Title']),
      status: cell(row['Status']) || 'draft',
      priority: cell(row['Priority']) || 'medium',
      description: cell(row['Description']),
      text: cell(row['Requirement Text']),
      rationale: cell(row['Rationale']),
      parentIds: cell(row['Parents'])
        .split(',')
        .map((id) => id.trim())
        .filter(isValidArtifactId),
      dateCreated: now,
      lastModified: now,
      revision: '01',
    }));
    requirements = validateImportedArtifacts<Requirement>(mapped, 'requirements', skipped);
  }

  const ucSheet = workbook.Sheets['Use Cases'];
  if (ucSheet) {
    const rows = xlsxUtils.sheet_to_json<Record<string, unknown>>(ucSheet);
    const mapped = rows.map((row) => ({
      id: cell(row['ID']),
      title: cell(row['Title']),
      actor: cell(row['Actor']),
      description: cell(row['Description']),
      preconditions: cell(row['Preconditions']),
      mainFlow: cell(row['Main Flow']),
      alternativeFlows: cell(row['Alternative Flows']),
      postconditions: cell(row['Postconditions']),
      priority: cell(row['Priority']) || 'medium',
      status: cell(row['Status']) || 'draft',
      lastModified: now,
      revision: '01',
    }));
    useCases = validateImportedArtifacts<UseCase>(mapped, 'useCases', skipped);
  }

  return {
    requirements,
    useCases,
    testCases: [],
    information: [],
    risks: [],
    documents: [],
    links: [],
    skipped,
  };
}

/**
 * Read an .xlsx/.xls file and parse it. The (large) xlsx library is loaded on demand.
 */
export async function parseExcelFile(
  data: Uint8Array,
  now: number = Date.now()
): Promise<ImportBundle> {
  const XLSX = await import('xlsx');
  return parseExcelImport(XLSX.read(data, { type: 'array' }), XLSX.utils, now);
}

/**
 * Links have no title; they need valid IDs for the link and both ends.
 */
export function validateImportedLinks(rows: unknown, skipped: SkippedImportRow[]): Link[] {
  if (rows === undefined || rows === null) return [];
  if (!Array.isArray(rows)) {
    skipped.push({ kind: 'links', index: -1, reason: '"links" is not a list' });
    return [];
  }
  const seen = new Set<string>();
  const valid: Link[] = [];
  rows.forEach((row, index) => {
    const l = (typeof row === 'object' && row !== null ? row : {}) as Record<string, unknown>;
    if (
      !isValidArtifactId(l.id) ||
      !isValidArtifactId(l.sourceId) ||
      !isValidArtifactId(l.targetId)
    ) {
      skipped.push({
        kind: 'links',
        index,
        reason: `invalid link ${JSON.stringify(l.id ?? null)}`,
      });
      return;
    }
    if (typeof l.type !== 'string' || seen.has(l.id)) {
      skipped.push({ kind: 'links', index, reason: `${l.id}: missing type or duplicate` });
      return;
    }
    seen.add(l.id);
    valid.push(l as unknown as Link);
  });
  return valid;
}

export function countImported(bundle: ImportBundle): number {
  return IMPORT_KINDS.reduce((sum, kind) => sum + bundle[kind].length, 0) + bundle.links.length;
}

/**
 * Highest numeric suffix among IDs like "REQ-042" → 42. Used to bump ID counters
 * after import so newly created artifacts never collide with imported ones.
 */
export function maxIdNumber(ids: string[], prefix: string): number {
  const pattern = new RegExp(`^${prefix}-(\\d+)$`);
  return ids.reduce((max, id) => {
    const match = pattern.exec(id);
    return match ? Math.max(max, parseInt(match[1], 10)) : max;
  }, 0);
}

/**
 * Human-readable summary of skipped rows (first few reasons).
 */
export function describeSkipped(skipped: SkippedImportRow[], limit = 3): string {
  if (skipped.length === 0) return '';
  const reasons = skipped.slice(0, limit).map((s) => `${s.kind}: ${s.reason}`);
  const more = skipped.length > limit ? ` (+${skipped.length - limit} more)` : '';
  return `Skipped ${skipped.length} invalid row(s): ${reasons.join('; ')}${more}`;
}
