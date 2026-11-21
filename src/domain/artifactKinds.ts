/**
 * The artifact kind registry: one definition per kind of artifact.
 *
 * This is the only place that knows which kinds exist. Identifiers, ID prefixes,
 * folders, labels and colors are all looked up here, so a feature that should
 * cover "every artifact" iterates ARTIFACT_KINDS instead of listing kinds by hand.
 *
 * Each kind lists its built-in fields (see fields.ts). The form, the table,
 * search and the file format are all derived from them.
 *
 * Pure TypeScript: no React, no IO.
 */
import {
  AUTHOR,
  CREATED,
  PRIORITY,
  REVISION,
  TITLE,
  customFieldsFor,
  options,
  type FieldDef,
} from './fields';
import type { CustomAttributeDefinition } from '../types/customAttributes';
import { LIFECYCLES, type Lifecycle } from './lifecycle';

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

export interface FormTab {
  id: string;
  label: string;
}

export interface ArtifactKind {
  id: ArtifactKindId;
  /** ID prefix and short tag on chips: REQ in REQ-001 */
  prefix: string;
  /** Folder in the project that holds one file per artifact */
  folder: string;
  label: { singular: string; plural: string };
  color: KindColors;
  /**
   * Built-in fields besides title, author, created and revision (which every
   * kind has), in file order. Status is one of them, since each kind has its own.
   */
  fields: FieldDef[];
  /** Form tabs the fields are grouped on, besides 'overview' */
  tabs?: FormTab[];
  /** The markdown field written right after the title, without a `##` heading */
  body?: string;
  /** Placeholder for the title of a new artifact */
  titlePlaceholder?: string;
  /** Its statuses and how it is reviewed; the status field is derived from it */
  lifecycle: Lifecycle;
}

/** The status field of a lifecycle: one option per state */
const status = (lifecycle: Lifecycle): FieldDef => ({
  id: 'status',
  label: 'Status',
  type: 'enum',
  options: options([...lifecycle.states]),
  default: lifecycle.initial,
  showInTable: true,
});

const markdown = (id: string, label: string, extra: Partial<FieldDef> = {}): FieldDef => ({
  id,
  label,
  type: 'markdown',
  ...extra,
});

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
    titlePlaceholder: 'e.g., System shall authenticate users',
    lifecycle: LIFECYCLES.specification,
    fields: [
      status(LIFECYCLES.specification),
      PRIORITY,
      { id: 'category', label: 'Category', type: 'text', default: 'technical', tab: 'details' },
      {
        id: 'verificationMethod',
        label: 'Verification Method',
        type: 'text',
        tab: 'details',
        showInTable: true,
      },
      { id: 'approvalDate', label: 'Approved', type: 'date', readOnly: true },
      markdown('description', 'Description', { showInTable: true }),
      markdown('text', 'Requirement Text', {
        showInTable: true,
        placeholder: 'Enter detailed requirement text with Markdown...',
      }),
      markdown('rationale', 'Rationale', {
        tab: 'details',
        showInTable: true,
        placeholder: 'Explain the reason for this requirement...',
      }),
      markdown('comments', 'Comments', { tab: 'details', omitWhenEmpty: true }),
    ],
    tabs: [{ id: 'details', label: 'Details' }],
  },
  {
    id: 'useCase',
    prefix: 'UC',
    folder: 'use-cases',
    label: { singular: 'Use Case', plural: 'Use Cases' },
    color: colors('--color-accent-light'),
    titlePlaceholder: 'e.g., User Login',
    lifecycle: LIFECYCLES.specification,
    fields: [
      status(LIFECYCLES.specification),
      PRIORITY,
      markdown('description', 'Description', { showInTable: true }),
      {
        id: 'actor',
        label: 'Actor',
        type: 'text',
        file: 'section',
        required: true,
        showInTable: true,
        placeholder: 'e.g., End User, Administrator, System',
      },
      markdown('preconditions', 'Preconditions', { tab: 'conditions' }),
      markdown('mainFlow', 'Main Flow', {
        tab: 'flows',
        placeholder: '1. User does X\n2. System does Y',
      }),
      markdown('alternativeFlows', 'Alternative Flows', { tab: 'flows', omitWhenEmpty: true }),
      markdown('postconditions', 'Postconditions', { tab: 'conditions' }),
    ],
    tabs: [
      { id: 'flows', label: 'Flows' },
      { id: 'conditions', label: 'Conditions' },
    ],
  },
  {
    id: 'testCase',
    prefix: 'TC',
    folder: 'test-cases',
    label: { singular: 'Test Case', plural: 'Test Cases' },
    color: colors('--color-success'),
    titlePlaceholder: 'e.g., Load Testing',
    lifecycle: LIFECYCLES.test,
    fields: [
      status(LIFECYCLES.test),
      PRIORITY,
      { id: 'lastRun', label: 'Last Run', type: 'date', readOnly: true },
      markdown('description', 'Description', { showInTable: true }),
      markdown('steps', 'Steps', { placeholder: '1. Open app\n2. Click login...' }),
      markdown('expectedResult', 'Expected Result'),
    ],
  },
  {
    id: 'information',
    prefix: 'INFO',
    folder: 'information',
    label: { singular: 'Information', plural: 'Information' },
    color: colors('--color-warning'),
    titlePlaceholder: 'e.g., System Architecture',
    lifecycle: LIFECYCLES.information,
    fields: [
      status(LIFECYCLES.information),
      {
        id: 'type',
        label: 'Type',
        type: 'enum',
        options: [
          { value: 'note', label: 'Note' },
          { value: 'meeting', label: 'Meeting Transcript' },
          { value: 'decision', label: 'Decision Log' },
          { value: 'reference', label: 'Reference' },
          { value: 'other', label: 'Other' },
        ],
        default: 'note',
        showInTable: true,
      },
      { id: 'description', label: 'Description', type: 'text', showInTable: true },
      markdown('text', 'Content'),
    ],
    body: 'text',
  },
  {
    id: 'risk',
    prefix: 'RISK',
    folder: 'risks',
    label: { singular: 'Risk', plural: 'Risks' },
    color: colors('--color-error'),
    lifecycle: LIFECYCLES.risk,
    fields: [
      status(LIFECYCLES.risk),
      {
        id: 'category',
        label: 'Category',
        type: 'enum',
        options: options(['technical', 'schedule', 'resource', 'external', 'other']),
        default: 'other',
        showInTable: true,
      },
      {
        id: 'probability',
        label: 'Probability',
        type: 'enum',
        options: options(['low', 'medium', 'high']),
        default: 'medium',
        showInTable: true,
      },
      {
        id: 'impact',
        label: 'Impact',
        type: 'enum',
        options: options(['low', 'medium', 'high']),
        default: 'medium',
        showInTable: true,
      },
      {
        id: 'owner',
        label: 'Owner',
        type: 'text',
        showInTable: true,
        placeholder: 'Person responsible for this risk',
      },
      markdown('description', 'Description', { showInTable: true }),
      markdown('mitigation', 'Mitigation Strategy', {
        tab: 'mitigation',
        placeholder: 'Actions to reduce the probability or impact of this risk',
      }),
      markdown('contingency', 'Contingency Plan', {
        tab: 'mitigation',
        placeholder: 'Actions to take if the risk occurs',
      }),
    ],
    tabs: [{ id: 'mitigation', label: 'Mitigation' }],
  },
  {
    id: 'document',
    prefix: 'DOC',
    folder: 'documents',
    label: { singular: 'Document', plural: 'Documents' },
    color: colors('--color-text-secondary'),
    lifecycle: LIFECYCLES.document,
    fields: [
      status(LIFECYCLES.document),
      markdown('description', 'Description', { showInTable: true }),
    ],
    body: 'description',
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

/** Kind whose files live in `folder`: "use-cases" -> 'useCase' */
export function kindOfFolder(folder: string): ArtifactKindId | undefined {
  return BY_FOLDER.get(folder)?.id;
}

/** A record with one entry per kind, e.g. kindRecord(() => []) */
export function kindRecord<T>(make: (id: ArtifactKindId) => T): Record<ArtifactKindId, T> {
  return Object.fromEntries(KIND_IDS.map((id) => [id, make(id)])) as Record<ArtifactKindId, T>;
}

/**
 * Every field of a kind, in form order: title, the built-in fields, author,
 * created and revision, then the custom attributes that apply to the kind.
 */
export function fieldsFor(
  id: ArtifactKindId,
  customAttributes: readonly CustomAttributeDefinition[] = []
): FieldDef[] {
  return [
    TITLE,
    ...kind(id).fields,
    AUTHOR,
    CREATED,
    REVISION,
    ...customFieldsFor(id, customAttributes),
  ];
}
