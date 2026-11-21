/**
 * The Excel export: one sheet per kind with a column per field (built-in and
 * custom) and per relation, plus links, the documents' outlines, revision
 * history and the two matrices. Its import reads the kind sheets, the links
 * and the outlines back by the same column labels, so an exported workbook
 * can be edited and imported again. The relation columns are derived from
 * the links and are not read: a link is changed in the Links sheet.
 */
import type * as XLSXModule from 'xlsx';
import {
  ARTIFACT_KINDS,
  fieldsFor,
  kind,
  kindOfId,
  type ArtifactKindId,
} from '../domain/artifactKinds';
import { defaultValues, setFieldValue, type FieldDef, type FieldValue } from '../domain/fields';
import { LINK_TYPE_IDS, linkTypeLabel } from '../domain/linkTypes';
import { fingerprint } from '../domain/fingerprint';
import { isSuspect } from '../domain/traceability';
import { formatDate, formatDateTime } from '../utils/dateUtils';
import type { CustomAttributeDefinition } from '../types/customAttributes';
import type { ArtifactDocument, BaseArtifact, DocumentEntry } from '../types';
import {
  exported,
  exportedLinks,
  fieldDisplay,
  relationLabels,
  relationsOf,
  type ExportOptions,
  type ExportSource,
} from './exportData';
import { changeSummary, type ArtifactChange } from './revisionHistory';
import { emptyBundle, validArtifacts, validLinks, type ImportBundle } from './importBundle';

type XLSX = typeof XLSXModule;
type Row = Record<string, string>;

const ID = 'ID';
const LINKS = 'Links';
const OUTLINE = 'Document Outline';

/** Link sheet columns */
const L = {
  id: 'Link ID',
  source: 'Source',
  type: 'Type',
  target: 'Target',
  created: 'Created',
  suspect: 'Suspect',
} as const;

/** Outline sheet columns: one row per entry, in order */
const O = { document: 'Document ID', level: 'Level', heading: 'Heading', artifact: 'Artifact ID' };

/** Each artifact's fingerprint, by ID */
function fingerprints(artifacts: Partial<Record<ArtifactKindId, readonly BaseArtifact[]>>) {
  const byId = new Map<string, string>();
  for (const k of ARTIFACT_KINDS) {
    for (const a of artifacts[k.id] ?? []) if (!a.isDeleted) byId.set(a.id, fingerprint(k.id, a));
  }
  return byId;
}

function width(field: FieldDef): number {
  if (field.type === 'markdown') return 40;
  if (field.id === 'title') return 30;
  return field.type === 'text' ? 20 : 14;
}

/** Column labels of a kind's fields; a custom attribute named like a built-in field gets "(custom)" */
function columnLabels(fields: readonly FieldDef[]): string[] {
  const seen = new Set<string>([ID]);
  return fields.map((f) => {
    let label = f.label;
    while (seen.has(label)) label = `${label} (custom)`;
    seen.add(label);
    return label;
  });
}

function sheet(xlsx: XLSX, rows: Row[], widths: number[], header?: string[]) {
  const ws = xlsx.utils.json_to_sheet(rows, header ? { header } : undefined);
  ws['!cols'] = widths.map((wch) => ({ wch }));
  return ws;
}

function kindSheet(xlsx: XLSX, source: ExportSource, kindId: ArtifactKindId) {
  const fields = fieldsFor(kindId, source.attributeDefinitions);
  const labels = columnLabels(fields);
  const relations = relationLabels(source, kindId);
  const links = exportedLinks(source);
  const rows = exported(source, kindId).map((a) => {
    const row: Row = { [ID]: a.id };
    fields.forEach((f, i) => (row[labels[i]] = fieldDisplay(a, f)));
    const rel = relationsOf(links, a.id);
    for (const label of relations) {
      row[label] = rel.find((r) => r.label === label)?.ids.join(', ') ?? '';
    }
    return row;
  });
  return sheet(
    xlsx,
    rows,
    [12, ...fields.map(width), ...relations.map(() => 20)],
    [ID, ...labels, ...relations]
  );
}

function historySheet(xlsx: XLSX, changes: readonly ArtifactChange[]) {
  const rows = changes.map((c) => ({
    Type: kind(c.kind).label.singular,
    ID: c.id,
    Title: c.title,
    Date: c.commits[0] ? formatDateTime(c.commits[0].timestamp) : '',
    Author: c.commits[0]?.author ?? '',
    Changes: changeSummary(c, kind(c.kind).label.singular),
  }));
  return sheet(xlsx, rows, [14, 12, 30, 20, 18, 60]);
}

function linksSheet(xlsx: XLSX, source: ExportSource) {
  const targets = fingerprints(source.artifacts);
  const rows = exportedLinks(source).map((l) => ({
    [L.id]: l.id,
    [L.source]: l.sourceId,
    [L.type]: linkTypeLabel(l.type),
    [L.target]: l.targetId,
    [L.created]: l.dateCreated ? formatDate(l.dateCreated) : '',
    [L.suspect]: isSuspect(l, targets.get(l.targetId)) ? 'Yes' : '',
  }));
  return sheet(xlsx, rows, [12, 14, 18, 14, 14, 10], Object.values(L));
}

/** Every document's outline: headings with their level, and the artifacts it includes */
function outlineSheet(xlsx: XLSX, source: ExportSource) {
  const rows: Row[] = [];
  for (const doc of exported(source, 'document') as ArtifactDocument[]) {
    for (const entry of doc.structure ?? []) {
      rows.push(
        entry.type === 'heading'
          ? {
              [O.document]: doc.id,
              [O.level]: String(entry.level ?? 1),
              [O.heading]: entry.title ?? '',
            }
          : { [O.document]: doc.id, [O.heading]: entry.title ?? '', [O.artifact]: entry.id ?? '' }
      );
    }
  }
  return sheet(xlsx, rows, [14, 8, 40, 14], Object.values(O));
}

/** Every exported artifact against every other: the cell names the link from row to column */
function traceabilitySheet(xlsx: XLSX, source: ExportSource, kinds: readonly ArtifactKindId[]) {
  const ids = kinds.flatMap((k) => exported(source, k).map((a) => a.id));
  const cell = new Map<string, string>();
  for (const l of exportedLinks(source))
    cell.set(`${l.sourceId}\n${l.targetId}`, linkTypeLabel(l.type));
  const rows = ids.map((row) => {
    const r: Row = { 'From / To': row };
    for (const col of ids) r[col] = row === col ? '-' : (cell.get(`${row}\n${col}`) ?? '');
    return r;
  });
  return sheet(xlsx, rows, [14, ...ids.map(() => 12)], ['From / To', ...ids]);
}

/** Requirements and the test cases that verify them, with columns for the results */
function verificationSheet(xlsx: XLSX, source: ExportSource) {
  const links = exportedLinks(source);
  const testCases = new Map(exported(source, 'testCase').map((t) => [t.id, t]));
  const verifiers = (reqId: string) =>
    links
      .filter(
        (l) => l.type === 'verifies' && l.targetId === reqId && kindOfId(l.sourceId) === 'testCase'
      )
      .map((l) => l.sourceId)
      .filter((id) => testCases.has(id))
      .sort();
  const header = [
    'Requirement ID',
    'Requirement Title',
    'Test Case ID',
    'Test Case Title',
    'Verification Status',
    'Tester',
    'Date',
    'Evidence / Notes',
  ];
  const rows: Row[] = [];
  for (const req of exported(source, 'requirement')) {
    const title = (req as unknown as { title: string }).title;
    const tcs = verifiers(req.id);
    if (tcs.length === 0) {
      rows.push({
        'Requirement ID': req.id,
        'Requirement Title': title,
        'Test Case ID': 'NOT LINKED',
        'Evidence / Notes': 'No test case verifies this requirement',
      });
    }
    for (const tc of tcs) {
      rows.push({
        'Requirement ID': req.id,
        'Requirement Title': title,
        'Test Case ID': tc,
        'Test Case Title': (testCases.get(tc) as unknown as { title: string }).title,
      });
    }
  }
  return sheet(xlsx, rows, [15, 30, 15, 30, 18, 15, 12, 50], header);
}

/** The workbook for these options; `changes` is null when there is no revision history */
export function buildWorkbook(
  xlsx: XLSX,
  source: ExportSource,
  options: ExportOptions,
  changes: readonly ArtifactChange[] | null
): XLSXModule.WorkBook {
  const wb = xlsx.utils.book_new();
  const add = (ws: XLSXModule.WorkSheet, name: string) =>
    xlsx.utils.book_append_sheet(wb, ws, name);
  const kinds = ARTIFACT_KINDS.map((k) => k.id).filter((k) => options.kinds.includes(k));

  if (options.revisionHistory && changes && changes.length > 0) {
    add(historySheet(xlsx, changes), 'Revision History');
  }
  for (const k of kinds) {
    if (exported(source, k).length > 0) add(kindSheet(xlsx, source, k), kind(k).label.plural);
  }
  if (
    kinds.includes('document') &&
    exported(source, 'document').some((d) => (d as ArtifactDocument).structure?.length)
  ) {
    add(outlineSheet(xlsx, source), OUTLINE);
  }
  if (options.links && exportedLinks(source).length > 0) add(linksSheet(xlsx, source), LINKS);
  if (options.traceabilityMatrix && kinds.some((k) => exported(source, k).length > 0)) {
    add(traceabilitySheet(xlsx, source, kinds), 'Traceability Matrix');
  }
  if (options.verificationMatrix && exported(source, 'requirement').length > 0) {
    add(verificationSheet(xlsx, source), 'Verification Matrix');
  }
  return wb;
}

// ---- Import ----

/** A cell as the field's value: enum labels back to values, Yes/No to booleans */
function cellValue(field: FieldDef, raw: unknown): FieldValue {
  if (raw === undefined || raw === null || raw === '') return undefined;
  const text = String(raw).trim();
  switch (field.type) {
    case 'enum': {
      const lower = text.toLowerCase();
      const option = field.options?.find(
        (o) => o.value.toLowerCase() === lower || o.label.toLowerCase() === lower
      );
      return option?.value ?? text;
    }
    case 'boolean':
      return ['yes', 'true', '1', 'x'].includes(text.toLowerCase());
    case 'number': {
      const n = Number(text);
      return Number.isNaN(n) ? undefined : n;
    }
    default:
      return text;
  }
}

const text = (raw: unknown) => (raw === undefined || raw === null ? '' : String(raw).trim());

/** A date cell: Excel's day number, or text such as 2026-11-21 */
function cellTime(raw: unknown, fallback: number): number {
  if (typeof raw === 'number') return Math.round((raw - 25569) * 86_400_000);
  const t = Date.parse(text(raw));
  return Number.isNaN(t) ? fallback : t;
}

/** Each document's outline from the outline sheet, by document ID */
function readOutlines(xlsx: XLSX, wb: XLSXModule.WorkBook): Map<string, DocumentEntry[]> {
  const outlines = new Map<string, DocumentEntry[]>();
  const ws = wb.Sheets[OUTLINE];
  if (!ws) return outlines;
  for (const row of xlsx.utils.sheet_to_json<Record<string, unknown>>(ws)) {
    const doc = text(row[O.document]);
    if (!doc) continue;
    const artifact = text(row[O.artifact]);
    const heading = text(row[O.heading]);
    const entry: DocumentEntry = artifact
      ? {
          type: 'artifact',
          id: artifact,
          ...(kindOfId(artifact) ? { artifactType: kindOfId(artifact) } : {}),
          ...(heading ? { title: heading } : {}),
        }
      : { type: 'heading', title: heading, level: Math.max(1, Number(text(row[O.level])) || 1) };
    if (!outlines.has(doc)) outlines.set(doc, []);
    outlines.get(doc)!.push(entry);
  }
  return outlines;
}

/** A link type from its label ("Verifies") or its ID ("verifies") */
function linkTypeOf(raw: unknown): string {
  const t = text(raw).toLowerCase();
  return LINK_TYPE_IDS.find((id) => id === t || linkTypeLabel(id).toLowerCase() === t) ?? t;
}

/**
 * Read a workbook back: the kind sheets (named like the kinds: "Requirements",
 * "Use Cases", …) with columns matched by field label, the documents'
 * outlines and the links. Read-only fields (author, dates, revision) and
 * relation columns are ignored.
 *
 * A link not marked suspect counts as reviewed against its target as
 * imported, or as it is in `existing` when the workbook does not have it.
 */
export function parseWorkbook(
  xlsx: XLSX,
  wb: XLSXModule.WorkBook,
  definitions: readonly CustomAttributeDefinition[],
  existing: Partial<Record<ArtifactKindId, readonly BaseArtifact[]>> = {},
  now = Date.now()
): ImportBundle {
  const bundle = emptyBundle();
  const outlines = readOutlines(xlsx, wb);
  for (const k of ARTIFACT_KINDS) {
    const ws = wb.Sheets[k.label.plural];
    if (!ws) continue;
    const fields = fieldsFor(k.id, definitions);
    const labels = columnLabels(fields);
    const rows = xlsx.utils.sheet_to_json<Record<string, unknown>>(ws).map((row) => {
      let item: Record<string, unknown> = {
        ...defaultValues(fields),
        id: text(row[ID]),
        dateCreated: now,
        lastModified: now,
      };
      fields.forEach((f, i) => {
        if (f.readOnly) return;
        const v = cellValue(f, row[labels[i]]);
        if (v !== undefined) item = setFieldValue(item, f, v);
      });
      if (k.id === 'document') item.structure = outlines.get(item.id as string) ?? [];
      return item;
    });
    bundle.artifacts[k.id] = validArtifacts(k.id, rows, bundle.skipped);
  }

  const ws = wb.Sheets[LINKS];
  if (ws) {
    const targets = new Map([...fingerprints(existing), ...fingerprints(bundle.artifacts)]);
    const rows = xlsx.utils.sheet_to_json<Record<string, unknown>>(ws).map((row) => {
      const targetId = text(row[L.target]);
      const suspect = ['yes', 'true', '1', 'x'].includes(text(row[L.suspect]).toLowerCase());
      const reviewed = suspect ? undefined : targets.get(targetId);
      const created = cellTime(row[L.created], now);
      return {
        id: text(row[L.id]),
        sourceId: text(row[L.source]),
        targetId,
        type: linkTypeOf(row[L.type]),
        ...(reviewed ? { reviewed } : {}),
        dateCreated: created,
        lastModified: now,
        revision: '01',
      };
    });
    bundle.links = validLinks(rows, bundle.skipped);
  }
  return bundle;
}
