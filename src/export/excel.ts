/**
 * The Excel export: one sheet per kind with a column per field (built-in and
 * custom) and per relation, plus links, revision history and the two
 * matrices. Its import reads the kind sheets back by the same column labels,
 * so an exported workbook can be edited and imported again.
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
import { linkTypeLabel } from '../domain/linkTypes';
import { formatDate, formatDateTime } from '../utils/dateUtils';
import type { CustomAttributeDefinition } from '../types/customAttributes';
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
import { emptyBundle, validArtifacts, type ImportBundle } from './importBundle';

type XLSX = typeof XLSXModule;
type Row = Record<string, string>;

const ID = 'ID';

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
  const rows = exportedLinks(source).map((l) => ({
    'Link ID': l.id,
    Source: l.sourceId,
    Type: linkTypeLabel(l.type),
    Target: l.targetId,
    Created: l.dateCreated ? formatDate(l.dateCreated) : '',
  }));
  return sheet(xlsx, rows, [12, 14, 18, 14, 14]);
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
  if (options.links && exportedLinks(source).length > 0) add(linksSheet(xlsx, source), 'Links');
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

/**
 * Read the kind sheets of a workbook (named like the kinds: "Requirements",
 * "Use Cases", …). Columns are matched by field label; read-only fields
 * (author, dates, revision) and relation columns are ignored.
 */
export function parseWorkbook(
  xlsx: XLSX,
  wb: XLSXModule.WorkBook,
  definitions: readonly CustomAttributeDefinition[],
  now = Date.now()
): ImportBundle {
  const bundle = emptyBundle();
  for (const k of ARTIFACT_KINDS) {
    const ws = wb.Sheets[k.label.plural];
    if (!ws) continue;
    const fields = fieldsFor(k.id, definitions);
    const labels = columnLabels(fields);
    const rows = xlsx.utils.sheet_to_json<Record<string, unknown>>(ws).map((row) => {
      let item: Record<string, unknown> = {
        ...defaultValues(fields),
        id: String(row[ID] ?? '').trim(),
        dateCreated: now,
        lastModified: now,
      };
      fields.forEach((f, i) => {
        if (f.readOnly) return;
        const v = cellValue(f, row[labels[i]]);
        if (v !== undefined) item = setFieldValue(item, f, v);
      });
      return item;
    });
    bundle.artifacts[k.id] = validArtifacts(k.id, rows, bundle.skipped);
  }
  return bundle;
}
