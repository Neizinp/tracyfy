/**
 * The file format of each artifact kind: one markdown file per artifact,
 * named by its ID (requirements/REQ-012.md).
 *
 *   ---
 *   title: Login timeout
 *   status: approved
 *   ---
 *
 *   # Login timeout
 *
 *   ## Description
 *   ...
 *
 * The format is derived from the kind's fields in the registry: short fields
 * go in the frontmatter, text fields are `## Label` sections (or the kind's
 * body, right after the title), so the file reads as a normal document. Times
 * are ISO 8601 (`2026-11-17T13:15:18.275Z`). The
 * frontmatter is validated with zod: a file that does not fit is reported,
 * never silently turned into different data.
 *
 * Pure TypeScript: no React, no IO.
 */
import { z } from 'zod';
import { kind, type ArtifactKindId } from './artifactKinds';
import type { FieldDef } from './fields';
import {
  FileFormatError,
  escapeBodyText,
  joinFrontmatter,
  readBody,
  splitFrontmatter,
} from './frontmatter';
import type {
  ArtifactDocument,
  BaseArtifact,
  Information,
  Requirement,
  Risk,
  TestCase,
  UseCase,
} from '../types/artifact';
import type { Link } from '../types/link';
import type { CustomAttributeValue } from '../types/customAttributes';
import { LINK_TYPE_IDS, linkTypeLabel } from './linkTypes';

/** A short text field; a bare number (`title: 2024`) is read as text */
const text = z.preprocess((v) => (typeof v === 'number' ? String(v) : v), z.string());
const optionalText = text.optional();

/**
 * A point in time. Files say `2026-11-17T13:15:18.275Z`; older files have
 * epoch milliseconds, which are still read. In the app it is epoch ms.
 */
const time = z.union([z.number(), z.string(), z.date()]).transform((v, ctx) => {
  const ms = typeof v === 'number' ? v : new Date(v).getTime();
  if (Number.isNaN(ms)) {
    ctx.addIssue({ code: 'custom', message: `not a date: ${String(v)}` });
    return z.NEVER;
  }
  return ms;
});

/** How a time is written: ISO 8601 in UTC */
const writeTime = (v: unknown) => (typeof v === 'number' ? new Date(v).toISOString() : v);

const customAttributes = z
  .array(
    z.object({
      attributeId: z.string(),
      value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
    })
  )
  .optional();

/** Fields every artifact file has in its frontmatter */
const common = {
  title: text,
  status: optionalText,
  author: optionalText,
  revision: optionalText,
  dateCreated: time.optional(),
  lastModified: time.optional(),
  isDeleted: z.boolean().optional(),
  deletedAt: time.optional(),
  customAttributes,
};
const COMMON_KEYS = Object.keys(common);
const TIME_KEYS = new Set(['dateCreated', 'lastModified', 'deletedAt']);

/** Frontmatter that is not a field: a document's outline */
const EXTRA: Partial<Record<ArtifactKindId, z.ZodRawShape>> = {
  document: {
    structure: z
      .array(
        z.object({
          type: z.enum(['heading', 'artifact']),
          id: optionalText,
          artifactType: optionalText,
          title: optionalText,
          level: z.number().optional(),
        })
      )
      .optional(),
  },
};
const EXTRA_DEFAULTS: Partial<Record<ArtifactKindId, Record<string, unknown>>> = {
  document: { structure: [] },
};

function fieldSchema(field: FieldDef): z.ZodTypeAny {
  switch (field.type) {
    case 'number':
      return z.number().optional();
    case 'date':
      return time.optional();
    case 'boolean':
      return z.boolean().optional();
    default:
      return optionalText;
  }
}

const inSection = (field: FieldDef) =>
  field.file === 'section' || (field.file === undefined && field.type === 'markdown');

interface KindFormat {
  schema: z.ZodObject<z.ZodRawShape>;
  /** Kind-specific frontmatter keys, in file order (after title and status) */
  keys: string[];
  /** Fields stored as `## Label` sections, in file order */
  sections: FieldDef[];
  /** Fields that are dates */
  times: Set<string>;
  /** Values for fields a file leaves out */
  defaults: Record<string, unknown>;
}

/** The file format of a kind, derived from its fields */
function formatOf(kindId: ArtifactKindId): KindFormat {
  const k = kind(kindId);
  const fields = k.fields.filter((f) => f.id !== k.body);
  const frontmatter = fields.filter((f) => !inSection(f));
  const kindKeys = frontmatter.filter((f) => !COMMON_KEYS.includes(f.id));
  const extra = EXTRA[kindId] ?? {};
  const states = k.lifecycle.states;
  const status = text
    .superRefine((v, ctx) => {
      if (!states.includes(v)) {
        ctx.addIssue({
          code: 'custom',
          message: `"${v}" is not a status of a ${k.label.singular.toLowerCase()} (${states.join(', ')})`,
        });
      }
    })
    .optional();
  const defaults: Record<string, unknown> = { ...EXTRA_DEFAULTS[kindId] };
  for (const f of k.fields) if (f.default !== undefined) defaults[f.id] = f.default;
  return {
    schema: z.object({
      ...common,
      status,
      ...Object.fromEntries(kindKeys.map((f) => [f.id, fieldSchema(f)])),
      ...extra,
    }),
    keys: [...kindKeys.map((f) => f.id), ...Object.keys(extra)],
    sections: fields.filter(inSection),
    times: new Set(kindKeys.filter((f) => f.type === 'date').map((f) => f.id)),
    defaults,
  };
}

const FORMATS = new Map<ArtifactKindId, KindFormat>();
const format = (kindId: ArtifactKindId) => {
  let f = FORMATS.get(kindId);
  if (!f) FORMATS.set(kindId, (f = formatOf(kindId)));
  return f;
};

/** The problems zod found, as one line a user can act on */
function describeIssues(error: z.ZodError): string {
  return error.issues.map((i) => `${i.path.join('.') || '(frontmatter)'}: ${i.message}`).join('; ');
}

const validAttributes = (attrs: CustomAttributeValue[] | undefined) =>
  (attrs || []).filter((a) => typeof a === 'object' && a !== null && 'attributeId' in a);

/** The file content of an artifact */
export function serializeArtifact(kindId: ArtifactKindId, artifact: BaseArtifact): string {
  const f = format(kindId);
  const body = kind(kindId).body;
  const item = artifact as unknown as Record<string, unknown>;
  const value = (field: string) => (item[field] || '') as string;

  const frontmatter: Record<string, unknown> = {
    title: item.title,
    status: item.status,
  };
  for (const key of f.keys) frontmatter[key] = f.times.has(key) ? writeTime(item[key]) : item[key];
  for (const key of COMMON_KEYS) {
    if (!(key in frontmatter))
      frontmatter[key] = TIME_KEYS.has(key) ? writeTime(item[key]) : item[key];
  }
  frontmatter.customAttributes = validAttributes(item.customAttributes as CustomAttributeValue[]);

  const parts = [`# ${item.title as string}`];
  if (body) parts.push(escapeBodyText(value(body)));
  for (const section of f.sections) {
    const content = value(section.id);
    if (section.omitWhenEmpty && !content) continue;
    parts.push(`## ${section.label}\n${escapeBodyText(content)}`);
  }
  return joinFrontmatter(frontmatter, parts.filter((p) => p !== '').join('\n\n'));
}

/** Read an artifact file; the ID is the file name. Throws FileFormatError naming the problem */
export function parseArtifact(kindId: ArtifactKindId, id: string, content: string): BaseArtifact {
  const f = format(kindId);
  const body = kind(kindId).body;
  const { data, body: markdown } = splitFrontmatter(content);
  const result = f.schema.safeParse(data);
  if (!result.success) throw new FileFormatError(describeIssues(result.error));

  const { text: intro, sections } = readBody(markdown);
  const item: Record<string, unknown> = { ...f.defaults };
  for (const [key, v] of Object.entries(result.data)) if (v !== undefined) item[key] = v;
  item.id = id;
  item.revision ??= '01';
  item.dateCreated ??= 0;
  item.lastModified ??= item.dateCreated;
  item.isDeleted ??= false;
  item.customAttributes ??= [];
  if (body) item[body] = intro;
  for (const section of f.sections) {
    const text = sections[section.label];
    item[section.id] = text || (section.omitWhenEmpty ? undefined : '');
  }
  return item as unknown as BaseArtifact;
}

// Typed shortcuts, for callers that know their kind
export const parseRequirement = (id: string, s: string) =>
  parseArtifact('requirement', id, s) as Requirement;
export const parseUseCase = (id: string, s: string) => parseArtifact('useCase', id, s) as UseCase;
export const parseTestCase = (id: string, s: string) =>
  parseArtifact('testCase', id, s) as TestCase;
export const parseInformation = (id: string, s: string) =>
  parseArtifact('information', id, s) as Information;
export const parseRisk = (id: string, s: string) => parseArtifact('risk', id, s) as Risk;
export const parseDocument = (id: string, s: string) =>
  parseArtifact('document', id, s) as ArtifactDocument;

// ---- Links: links/LINK-042.md ----

const linkSchema = z.object({
  source: z.string().min(1),
  type: z.enum(LINK_TYPE_IDS),
  target: z.string().min(1),
  reviewed: z
    .string()
    .regex(/^[0-9a-f]{8}$/, 'must be a fingerprint like 3f9a1c2e')
    .optional(),
  revision: optionalText,
  dateCreated: time.optional(),
  lastModified: time.optional(),
  isDeleted: z.boolean().optional(),
  deletedAt: time.optional(),
  customAttributes,
});

export function serializeLink(link: Link): string {
  return joinFrontmatter(
    {
      source: link.sourceId,
      type: link.type,
      target: link.targetId,
      reviewed: link.reviewed,
      revision: link.revision,
      dateCreated: writeTime(link.dateCreated),
      lastModified: writeTime(link.lastModified),
      ...(link.isDeleted ? { isDeleted: true, deletedAt: writeTime(link.deletedAt) } : {}),
      customAttributes: validAttributes(link.customAttributes),
    },
    `# ${link.id}\n\nLinks **${link.sourceId}** to **${link.targetId}** (${linkTypeLabel(link.type).toLowerCase()})`
  );
}

export function parseLink(id: string, content: string): Link {
  const { data } = splitFrontmatter(content);
  const result = linkSchema.safeParse(data);
  if (!result.success) throw new FileFormatError(describeIssues(result.error));
  const l = result.data;
  return {
    id,
    sourceId: l.source,
    targetId: l.target,
    type: l.type,
    ...(l.reviewed ? { reviewed: l.reviewed } : {}),
    revision: l.revision ?? '01',
    dateCreated: l.dateCreated ?? 0,
    lastModified: l.lastModified ?? l.dateCreated ?? 0,
    ...(l.isDeleted ? { isDeleted: true, ...(l.deletedAt ? { deletedAt: l.deletedAt } : {}) } : {}),
    customAttributes: l.customAttributes ?? [],
  };
}

export { FileFormatError };
