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
 * Short fields go in the frontmatter; text fields are `## ` sections (or the
 * text right after the title), so the file reads as a normal document. The
 * frontmatter is validated with zod: a file that does not fit is reported,
 * never silently turned into different data.
 *
 * Pure TypeScript: no React, no IO.
 */
import { z } from 'zod';
import type { ArtifactKindId } from './artifactKinds';
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
import { LINK_INVERSE, type LinkType } from './linkTypes';

const LINK_TYPE_IDS = Object.keys(LINK_INVERSE) as [LinkType, ...LinkType[]];

/** A short text field; a bare number (`title: 2024`) is read as text */
const text = z.preprocess((v) => (typeof v === 'number' ? String(v) : v), z.string());
const optionalText = text.optional();
const time = z.number();

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

interface Section {
  heading: string;
  field: string;
  /** Leave the heading out when the field is empty */
  optional?: boolean;
}

interface KindFormat {
  /** Frontmatter: the common fields plus these */
  schema: z.ZodObject<z.ZodRawShape>;
  /** Kind-specific frontmatter keys, in file order (after title and status) */
  keys: string[];
  /** Text fields stored as `## heading` sections, in file order */
  sections: Section[];
  /** Text field stored right after the title, before any section */
  intro?: string;
  /** Values for fields a file leaves out */
  defaults: Record<string, unknown>;
}

const FORMATS: Record<ArtifactKindId, KindFormat> = {
  requirement: {
    schema: z.object({
      ...common,
      priority: optionalText,
      category: optionalText,
      verificationMethod: optionalText,
      approvalDate: time.optional(),
    }),
    keys: ['priority', 'category', 'verificationMethod', 'approvalDate'],
    sections: [
      { heading: 'Description', field: 'description' },
      { heading: 'Requirement Text', field: 'text' },
      { heading: 'Rationale', field: 'rationale' },
      { heading: 'Comments', field: 'comments', optional: true },
    ],
    defaults: { status: 'draft', priority: 'medium', category: 'technical' },
  },
  useCase: {
    schema: z.object({ ...common, priority: optionalText }),
    keys: ['priority'],
    sections: [
      { heading: 'Description', field: 'description' },
      { heading: 'Actor', field: 'actor' },
      { heading: 'Preconditions', field: 'preconditions' },
      { heading: 'Main Flow', field: 'mainFlow' },
      { heading: 'Alternative Flows', field: 'alternativeFlows', optional: true },
      { heading: 'Postconditions', field: 'postconditions' },
    ],
    defaults: { status: 'draft', priority: 'medium' },
  },
  testCase: {
    schema: z.object({ ...common, priority: optionalText, lastRun: time.optional() }),
    keys: ['priority', 'lastRun'],
    sections: [
      { heading: 'Description', field: 'description' },
      { heading: 'Steps', field: 'steps' },
      { heading: 'Expected Result', field: 'expectedResult' },
    ],
    defaults: { status: 'draft', priority: 'medium' },
  },
  information: {
    schema: z.object({ ...common, type: optionalText, description: optionalText }),
    keys: ['type', 'description'],
    sections: [],
    intro: 'text',
    defaults: { type: 'note' },
  },
  risk: {
    schema: z.object({
      ...common,
      category: optionalText,
      probability: optionalText,
      impact: optionalText,
      owner: optionalText,
    }),
    keys: ['category', 'probability', 'impact', 'owner'],
    sections: [
      { heading: 'Description', field: 'description' },
      { heading: 'Mitigation Strategy', field: 'mitigation' },
      { heading: 'Contingency Plan', field: 'contingency' },
    ],
    defaults: { status: 'identified', category: 'other', probability: 'medium', impact: 'medium' },
  },
  document: {
    schema: z.object({
      ...common,
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
    }),
    keys: ['structure'],
    sections: [],
    intro: 'description',
    defaults: { structure: [] },
  },
};

/** Text fields that also go by an older name in the app's types */
const ALIASES: Partial<Record<ArtifactKindId, Record<string, string>>> = {
  useCase: { preconditions: 'precondition', postconditions: 'postcondition' },
  information: { text: 'content' },
};

/** The problems zod found, as one line a user can act on */
function describeIssues(error: z.ZodError): string {
  return error.issues.map((i) => `${i.path.join('.') || '(frontmatter)'}: ${i.message}`).join('; ');
}

const validAttributes = (attrs: CustomAttributeValue[] | undefined) =>
  (attrs || []).filter((a) => typeof a === 'object' && a !== null && 'attributeId' in a);

/** The file content of an artifact */
export function serializeArtifact(kindId: ArtifactKindId, artifact: BaseArtifact): string {
  const format = FORMATS[kindId];
  const item = artifact as unknown as Record<string, unknown>;
  const aliases = ALIASES[kindId] ?? {};
  const value = (field: string) => (item[field] || item[aliases[field]] || '') as string;

  const frontmatter: Record<string, unknown> = {
    title: item.title,
    status: item.status,
  };
  for (const key of format.keys) frontmatter[key] = item[key];
  for (const key of COMMON_KEYS) {
    if (!(key in frontmatter)) frontmatter[key] = item[key];
  }
  frontmatter.customAttributes = validAttributes(item.customAttributes as CustomAttributeValue[]);

  const parts = [`# ${item.title as string}`];
  if (format.intro) parts.push(escapeBodyText(value(format.intro)));
  for (const section of format.sections) {
    const content = value(section.field);
    if (section.optional && !content) continue;
    parts.push(`## ${section.heading}\n${escapeBodyText(content)}`);
  }
  return joinFrontmatter(frontmatter, parts.filter((p) => p !== '').join('\n\n'));
}

/** Read an artifact file; the ID is the file name. Throws FileFormatError naming the problem */
export function parseArtifact(kindId: ArtifactKindId, id: string, content: string): BaseArtifact {
  const format = FORMATS[kindId];
  const { data, body } = splitFrontmatter(content);
  const result = format.schema.safeParse(data);
  if (!result.success) throw new FileFormatError(describeIssues(result.error));

  const { text: intro, sections } = readBody(body);
  const item: Record<string, unknown> = { ...format.defaults };
  for (const [key, v] of Object.entries(result.data)) if (v !== undefined) item[key] = v;
  item.id = id;
  item.revision ??= '01';
  item.dateCreated ??= 0;
  item.lastModified ??= item.dateCreated;
  item.isDeleted ??= false;
  item.customAttributes ??= [];
  if (format.intro) item[format.intro] = intro;
  for (const section of format.sections) {
    const content = sections[section.heading];
    item[section.field] = content || (section.optional ? undefined : '');
  }
  for (const [field, alias] of Object.entries(ALIASES[kindId] ?? {})) item[alias] = item[field];
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
  revision: optionalText,
  dateCreated: time.optional(),
  lastModified: time.optional(),
  customAttributes,
});

export function serializeLink(link: Link): string {
  return joinFrontmatter(
    {
      source: link.sourceId,
      type: link.type,
      target: link.targetId,
      revision: link.revision,
      dateCreated: link.dateCreated,
      lastModified: link.lastModified,
      customAttributes: validAttributes(link.customAttributes),
    },
    `# ${link.id}\n\nLinks **${link.sourceId}** to **${link.targetId}** (${link.type.replaceAll('_', ' ')})`
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
    revision: l.revision ?? '01',
    dateCreated: l.dateCreated ?? 0,
    lastModified: l.lastModified ?? l.dateCreated ?? 0,
    customAttributes: l.customAttributes ?? [],
  };
}

export { FileFormatError };
