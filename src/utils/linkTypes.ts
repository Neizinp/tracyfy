/**
 * Link Type Definitions and Inverse Mapping
 *
 * Links are stored as separate files in the links/ folder.
 * Each link has a source, target, and type. The inverse type
 * is computed when viewing from the target's perspective.
 */

export type LinkType =
  // Hierarchical
  | 'parent'
  | 'child'
  // Derivation
  | 'derived_from'
  | 'derives_to'
  // Dependency
  | 'depends_on'
  | 'depended_on_by'
  // Refinement
  | 'refines'
  | 'refined_by'
  // Implementation
  | 'satisfies'
  | 'satisfied_by'
  // Verification
  | 'verifies'
  | 'verified_by'
  // Constraints
  | 'constrains'
  | 'constrained_by'
  // Preconditions
  | 'requires'
  | 'required_by'
  // Symmetric types
  | 'conflicts_with'
  | 'duplicates'
  | 'related_to';

/**
 * Mapping from a link type to its inverse.
 * When artifact A links to B with type X, B sees A with type LINK_INVERSE[X].
 */
export const LINK_INVERSE: Record<LinkType, LinkType> = {
  // Hierarchical
  parent: 'child',
  child: 'parent',
  // Derivation
  derived_from: 'derives_to',
  derives_to: 'derived_from',
  // Dependency
  depends_on: 'depended_on_by',
  depended_on_by: 'depends_on',
  // Refinement
  refines: 'refined_by',
  refined_by: 'refines',
  // Implementation
  satisfies: 'satisfied_by',
  satisfied_by: 'satisfies',
  // Verification
  verifies: 'verified_by',
  verified_by: 'verifies',
  // Constraints
  constrains: 'constrained_by',
  constrained_by: 'constrains',
  // Preconditions
  requires: 'required_by',
  required_by: 'requires',
  // Symmetric (same both directions)
  conflicts_with: 'conflicts_with',
  duplicates: 'duplicates',
  related_to: 'related_to',
};

/**
 * Human-readable labels for link types
 */
export const LINK_TYPE_LABELS: Record<LinkType, string> = {
  parent: 'Parent of',
  child: 'Child of',
  derived_from: 'Derived from',
  derives_to: 'Derives to',
  depends_on: 'Depends on',
  depended_on_by: 'Depended on by',
  refines: 'Refines',
  refined_by: 'Refined by',
  satisfies: 'Satisfies',
  satisfied_by: 'Satisfied by',
  verifies: 'Verifies',
  verified_by: 'Verified by',
  constrains: 'Constrains',
  constrained_by: 'Constrained by',
  requires: 'Requires',
  required_by: 'Required by',
  conflicts_with: 'Conflicts with',
  duplicates: 'Duplicates',
  related_to: 'Related to',
};

/**
 * Link types that are symmetric - no inverse needed
 */
export const SYMMETRIC_TYPES: LinkType[] = ['conflicts_with', 'duplicates', 'related_to'];

/**
 * Check if a link type is symmetric
 */
export function isSymmetricType(type: LinkType): boolean {
  return SYMMETRIC_TYPES.includes(type);
}

/**
 * Get the inverse of a link type
 */
export function getInverseType(type: LinkType): LinkType {
  return LINK_INVERSE[type];
}
