/**
 * Link types: the relations a link can express.
 *
 * A link is one fact, stored in one direction: "TC-007 verifies REQ-012".
 * Read from the target's side the same link says "REQ-012 is verified by
 * TC-007", but that is only a label, never a second type, so there is exactly
 * one way to store each fact. Symmetric types read the same from both ends.
 *
 * Pure TypeScript: no React, no IO.
 */

interface LinkTypeDef {
  /** Read from the source: "TC-007 Verifies REQ-012" */
  label: string;
  /** Read from the target: "REQ-012 Verified by TC-007"; none for a symmetric type */
  inverse?: string;
  /** What it is for, shown in the link dialog */
  description: string;
}

export const LINK_TYPES = {
  verifies: {
    label: 'Verifies',
    inverse: 'Verified by',
    description: 'A test shows that it is met',
  },
  satisfies: {
    label: 'Satisfies',
    inverse: 'Satisfied by',
    description: 'Meets a need or realizes a use case',
  },
  refines: {
    label: 'Refines',
    inverse: 'Refined by',
    description: 'Adds detail to it (a child of it)',
  },
  derived_from: {
    label: 'Derived from',
    inverse: 'Source of',
    description: 'Follows from it',
  },
  mitigates: {
    label: 'Mitigates',
    inverse: 'Mitigated by',
    description: 'Reduces the risk',
  },
  depends_on: {
    label: 'Depends on',
    inverse: 'Depended on by',
    description: 'Needs it to be in place',
  },
  constrains: {
    label: 'Constrains',
    inverse: 'Constrained by',
    description: 'Restricts how it can be met',
  },
  requires: {
    label: 'Requires',
    inverse: 'Required by',
    description: 'Has it as a precondition',
  },
  conflicts_with: { label: 'Conflicts with', description: 'Both cannot be met' },
  duplicates: { label: 'Duplicates', description: 'Says the same thing' },
  related_to: { label: 'Related to', description: 'Any other association' },
} as const satisfies Record<string, LinkTypeDef>;

export type LinkType = keyof typeof LINK_TYPES;

export const LINK_TYPE_IDS = Object.keys(LINK_TYPES) as [LinkType, ...LinkType[]];

export function isLinkType(value: unknown): value is LinkType {
  return typeof value === 'string' && value in LINK_TYPES;
}

/** A symmetric type says the same thing from both ends */
export function isSymmetricType(type: LinkType): boolean {
  return !('inverse' in LINK_TYPES[type]);
}

/** The type's name, read from the source */
export const linkTypeLabel = (type: LinkType): string => LINK_TYPES[type]?.label ?? type;

/** How a link reads from one of its ends: "Verifies" from the source, "Verified by" from the target */
export function linkLabelFrom(type: LinkType, end: 'source' | 'target'): string {
  const def: LinkTypeDef = LINK_TYPES[type];
  if (!def) return type;
  return end === 'target' && def.inverse ? def.inverse : def.label;
}
