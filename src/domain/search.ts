/**
 * Advanced search: criteria ("Status is approved", "Rationale contains
 * audit") over every artifact of every kind. The properties to search by
 * are the fields in the registry plus the custom attributes, so a new
 * field or kind is searchable without changes here.
 *
 * Pure TypeScript: no React, no IO.
 */
import { ARTIFACT_KINDS, fieldsFor, type ArtifactKindId } from './artifactKinds';
import { getFieldValue, type FieldDef, type FieldOption } from './fields';
import type { CustomAttributeDefinition } from '../types/customAttributes';
import type { ArtifactsByKind } from '../types/state';

export type PropertyType = 'text' | 'select' | 'date';

export interface SearchProperty {
  value: string;
  label: string;
  type: PropertyType;
  options?: FieldOption[];
}

export interface PropertyGroup {
  label: string;
  properties: SearchProperty[];
}

export interface SearchCriterion {
  id: string;
  property: string;
  condition: string;
  value: string;
}

export interface SearchResult {
  id: string;
  type: ArtifactKindId;
  title: string;
  status: string;
  description: string;
}

export const CONDITIONS: Record<PropertyType, { value: string; label: string }[]> = {
  text: [
    { value: 'contains', label: 'Contains' },
    { value: 'equals', label: 'Equals' },
    { value: 'startsWith', label: 'Starts with' },
    { value: 'endsWith', label: 'Ends with' },
    { value: 'notContains', label: 'Does not contain' },
    { value: 'isEmpty', label: 'Is empty' },
    { value: 'isNotEmpty', label: 'Is not empty' },
  ],
  select: [
    { value: 'equals', label: 'Is' },
    { value: 'notEquals', label: 'Is not' },
  ],
  date: [
    { value: 'on', label: 'On' },
    { value: 'before', label: 'Before' },
    { value: 'after', label: 'After' },
  ],
};

/** Saved filters from before custom fields were `attr:` fields */
const normalize = (property: string) =>
  property.startsWith('custom_') ? `attr:${property.slice('custom_'.length)}` : property;

const typeOf = (field: FieldDef): PropertyType =>
  field.type === 'enum' || field.type === 'boolean'
    ? 'select'
    : field.type === 'date'
      ? 'date'
      : 'text';

const BOOLEAN_OPTIONS: FieldOption[] = [
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' },
];

/** One property per field id: a field several kinds share (status) has all their options */
function propertiesOf(fields: FieldDef[]): SearchProperty[] {
  const byId = new Map<string, SearchProperty>();
  for (const f of fields) {
    const existing = byId.get(f.id);
    const type = typeOf(f);
    const options = f.type === 'boolean' ? BOOLEAN_OPTIONS : f.options;
    if (!existing) {
      byId.set(f.id, { value: f.id, label: f.label, type, options });
    } else if (existing.type !== type) {
      // e.g. a requirement's free-text category and a risk's category list
      byId.set(f.id, { ...existing, type: 'text', options: undefined });
    } else if (existing.options && options) {
      const known = new Set(existing.options.map((o) => o.value));
      existing.options = [...existing.options, ...options.filter((o) => !known.has(o.value))];
    }
  }
  return [...byId.values()];
}

const COMMON = new Set(['title', 'status', 'author', 'dateCreated', 'revision', 'description']);

/** What the user can search by, grouped for the property menu */
export function searchProperties(
  definitions: readonly CustomAttributeDefinition[]
): PropertyGroup[] {
  const all = ARTIFACT_KINDS.flatMap((k) => fieldsFor(k.id));
  const common = propertiesOf(all.filter((f) => COMMON.has(f.id)));
  const groups: PropertyGroup[] = [
    {
      label: 'Common',
      properties: [
        { value: 'any', label: 'Any Field', type: 'text' },
        { value: 'id', label: 'ID', type: 'text' },
        {
          value: '_type',
          label: 'Artifact Type',
          type: 'select',
          options: ARTIFACT_KINDS.map((k) => ({ value: k.id, label: k.label.singular })),
        },
        ...common,
        { value: 'lastModified', label: 'Modified', type: 'date' },
      ],
    },
  ];
  const seen = new Set(common.map((p) => p.value));
  for (const k of ARTIFACT_KINDS) {
    const own = propertiesOf(
      all.filter((f) => !seen.has(f.id) && fieldsFor(k.id).some((g) => g.id === f.id))
    );
    own.forEach((p) => seen.add(p.value));
    if (own.length > 0) groups.push({ label: k.label.singular, properties: own });
  }
  if (definitions.length > 0) {
    const custom = propertiesOf(ARTIFACT_KINDS.flatMap((k) => fieldsFor(k.id, definitions))).filter(
      (p) => p.value.startsWith('attr:')
    );
    groups.push({ label: 'Custom Attributes', properties: custom });
  }
  return groups;
}

export function findProperty(groups: PropertyGroup[], property: string) {
  const value = normalize(property);
  for (const g of groups) {
    const p = g.properties.find((q) => q.value === value);
    if (p) return p;
  }
  return undefined;
}

const dateOf = (v: unknown) =>
  typeof v === 'number' ? new Date(v).toISOString().slice(0, 10) : String(v).slice(0, 10);

/** Whether one value meets one criterion */
export function matchesValue(fieldValue: unknown, criterion: SearchCriterion): boolean {
  const { condition, value } = criterion;
  const blank = fieldValue === undefined || fieldValue === null || String(fieldValue).trim() === '';
  if (condition === 'isEmpty') return blank;
  if (condition === 'isNotEmpty') return !blank;
  if (!value) return true;

  const text = blank ? '' : String(fieldValue).toLowerCase();
  const wanted = value.toLowerCase();
  switch (condition) {
    case 'equals':
      return text === wanted;
    case 'notEquals':
      return text !== wanted;
    case 'startsWith':
      return text.startsWith(wanted);
    case 'endsWith':
      return text.endsWith(wanted);
    case 'notContains':
      return !text.includes(wanted);
    case 'on':
    case 'before':
    case 'after': {
      if (blank || (typeof fieldValue === 'number' && fieldValue <= 0)) return false;
      const date = dateOf(fieldValue);
      return condition === 'on'
        ? date === value
        : condition === 'before'
          ? date < value
          : date > value;
    }
    default:
      return text.includes(wanted);
  }
}

type Item = Record<string, unknown> & { id: string };

function valueOf(item: Item, kindId: ArtifactKindId, property: string, fields: FieldDef[]) {
  if (property === 'any') {
    return [item.id, ...fields.map((f) => getFieldValue(item, f))]
      .filter((v) => typeof v === 'string')
      .join(' ');
  }
  if (property === '_type') return kindId;
  if (property === 'id' || property === 'lastModified') return item[property];
  const field = fields.find((f) => f.id === property);
  return field ? getFieldValue(item, field) : undefined;
}

/** Every artifact (not in the trash) of every kind that meets all criteria */
export function searchArtifacts(
  artifacts: ArtifactsByKind,
  criteria: readonly SearchCriterion[],
  definitions: readonly CustomAttributeDefinition[]
): SearchResult[] {
  const active = criteria
    .map((c) => ({ ...c, property: normalize(c.property) }))
    .filter((c) => c.value || c.condition === 'isEmpty' || c.condition === 'isNotEmpty');
  const results: SearchResult[] = [];
  for (const k of ARTIFACT_KINDS) {
    const fields = fieldsFor(k.id, definitions);
    for (const item of artifacts[k.id] as unknown as Item[]) {
      if (item.isDeleted) continue;
      if (!active.every((c) => matchesValue(valueOf(item, k.id, c.property, fields), c))) continue;
      results.push({
        id: item.id,
        type: k.id,
        title: String(item.title ?? ''),
        status: String(item.status ?? ''),
        description: String(item.description ?? item.text ?? ''),
      });
    }
  }
  return results;
}
