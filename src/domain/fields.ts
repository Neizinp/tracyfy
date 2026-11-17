/**
 * Field definitions: what a field of an artifact is, built-in or custom.
 *
 * Built-in fields come from the kind registry (artifactKinds.ts); custom
 * attributes are defined in tracyfy.yaml and turned into the same FieldDef
 * here. The form, the table, search and the file format all iterate
 * `fieldsFor(kind, customAttributes)`, so a new field needs no UI code.
 *
 * Pure TypeScript: no React, no IO.
 */
import type { ArtifactKindId } from './artifactKinds';
import type {
  CustomAttributeDefinition,
  CustomAttributeValue,
  AttributeType,
} from '../types/customAttributes';

export type FieldType = 'text' | 'markdown' | 'number' | 'date' | 'enum' | 'boolean' | 'user';

export interface FieldOption {
  value: string;
  label: string;
}

export type FieldValue = string | number | boolean | null | undefined;

export interface FieldDef {
  /** Property on the artifact, or `attr:<attribute id>` for a custom attribute */
  id: string;
  label: string;
  type: FieldType;
  /** For enum fields */
  options?: FieldOption[];
  required?: boolean;
  /** Value of a new artifact, and of a file that leaves the field out */
  default?: string | number | boolean;
  /** Help text under the label */
  description?: string;
  placeholder?: string;
  /** Column visible until the user changes it */
  showInTable?: boolean;
  /** Form tab the field is edited on (see ArtifactKind.tabs); 'overview' if not set */
  tab?: string;
  /** Kept up to date by the app; the form shows it (when set) but does not edit it */
  readOnly?: boolean;
  /**
   * Where the field goes in the file. Markdown fields are `## Label` sections,
   * everything else is a frontmatter key; set this to put a short text field in
   * a section anyway.
   */
  file?: 'frontmatter' | 'section';
  /** A section that is left out of the file while the field is empty */
  omitWhenEmpty?: boolean;
}

const CUSTOM_PREFIX = 'attr:';

// ---- Fields every kind has ----

export const TITLE: FieldDef = { id: 'title', label: 'Title', type: 'text', required: true };
export const AUTHOR: FieldDef = {
  id: 'author',
  label: 'Author',
  type: 'user',
  readOnly: true,
  showInTable: true,
};
export const CREATED: FieldDef = {
  id: 'dateCreated',
  label: 'Created',
  type: 'date',
  readOnly: true,
  showInTable: true,
};
export const REVISION: FieldDef = { id: 'revision', label: 'Rev', type: 'text', readOnly: true };

export const PRIORITY: FieldDef = {
  id: 'priority',
  label: 'Priority',
  type: 'enum',
  options: options(['low', 'medium', 'high']),
  default: 'medium',
  showInTable: true,
};

/** Enum options whose labels are the values, capitalized: ['in_review'] -> 'In review' */
export function options(values: string[]): FieldOption[] {
  return values.map((value) => ({
    value,
    label: value.charAt(0).toUpperCase() + value.slice(1).replaceAll('_', ' '),
  }));
}

// ---- Custom attributes ----

const CUSTOM_TYPES: Record<AttributeType, FieldType> = {
  text: 'text',
  number: 'number',
  date: 'date',
  dropdown: 'enum',
  checkbox: 'boolean',
};

export const isCustomField = (field: FieldDef) => field.id.startsWith(CUSTOM_PREFIX);

/** The attribute ID of a custom field: 'attr:ATTR-001' -> 'ATTR-001' */
export const attributeIdOf = (field: FieldDef) => field.id.slice(CUSTOM_PREFIX.length);

/** A custom attribute definition as a field */
export function customField(def: CustomAttributeDefinition): FieldDef {
  return {
    id: `${CUSTOM_PREFIX}${def.id}`,
    label: def.name,
    type: CUSTOM_TYPES[def.type],
    options:
      def.type === 'dropdown'
        ? (def.options ?? []).map((o) => ({ value: o, label: o }))
        : undefined,
    required: def.required,
    default: def.defaultValue,
    description: def.description,
    tab: 'customAttributes',
  };
}

/** The custom attributes that apply to a kind, as fields */
export function customFieldsFor(
  kindId: ArtifactKindId,
  definitions: readonly CustomAttributeDefinition[]
): FieldDef[] {
  return definitions.filter((d) => d.appliesTo.includes(kindId)).map(customField);
}

// ---- Values ----

type Fields = Record<string, unknown>;

/** The value of a field on an artifact (or on a form's draft of one) */
export function getFieldValue(item: object, field: FieldDef): FieldValue {
  const record = item as Fields;
  if (isCustomField(field)) {
    const id = attributeIdOf(field);
    const attrs = (record.customAttributes as CustomAttributeValue[] | undefined) ?? [];
    return attrs.find((a) => a.attributeId === id)?.value;
  }
  return record[field.id] as FieldValue;
}

/** A copy of `item` with the field set to `value` */
export function setFieldValue<T extends object>(item: T, field: FieldDef, value: FieldValue): T {
  const record = item as Fields;
  if (!isCustomField(field)) return { ...item, [field.id]: value };
  const id = attributeIdOf(field);
  const attrs = ((record.customAttributes as CustomAttributeValue[] | undefined) ?? []).filter(
    (a) => a.attributeId !== id
  );
  const v = value === undefined ? null : value;
  return { ...item, customAttributes: [...attrs, { attributeId: id, value: v }] };
}

const isBlank = (v: FieldValue) => v === undefined || v === null || v === '';

/** Fields that are required but empty, by label */
export function missingRequired(item: object, fields: readonly FieldDef[]): string[] {
  return fields
    .filter((f) => f.required && !f.readOnly && f.type !== 'boolean')
    .filter((f) => {
      const v = getFieldValue(item, f);
      return isBlank(typeof v === 'string' ? v.trim() : v);
    })
    .map((f) => f.label);
}

/** The values a new artifact starts with: each field's default */
export function defaultValues(fields: readonly FieldDef[]): Fields {
  let item: Fields = { customAttributes: [] };
  for (const field of fields) {
    if (field.readOnly) continue;
    if (field.default !== undefined) item = setFieldValue(item, field, field.default);
    else if (!isCustomField(field)) {
      item[field.id] =
        field.type === 'enum' ? field.options?.[0]?.value : field.type === 'boolean' ? false : '';
    }
  }
  return item;
}

/** Whether plain-text search looks at this field */
export const isSearchable = (field: FieldDef) =>
  field.type === 'text' ||
  field.type === 'markdown' ||
  field.type === 'enum' ||
  field.type === 'user';

/** The label of an enum value, or the value itself */
export function optionLabel(field: FieldDef, value: FieldValue): string {
  if (isBlank(value)) return '';
  return field.options?.find((o) => o.value === value)?.label ?? String(value);
}

/**
 * A field value as plain text, for search and sorting. Dates stay sortable
 * (epoch ms or YYYY-MM-DD); booleans read as Yes / No.
 */
export function fieldText(item: object, field: FieldDef): string {
  const v = getFieldValue(item, field);
  if (isBlank(v)) return '';
  if (field.type === 'boolean') return v ? 'Yes' : 'No';
  if (field.type === 'enum') return optionLabel(field, v);
  return String(v);
}
