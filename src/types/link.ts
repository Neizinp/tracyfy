import type { CustomAttributeValue } from './customAttributes';
import type { LinkType } from '../utils/linkTypes';

// Link stored within an artifact (DEPRECATED - use Link instead)
export interface ArtifactLink {
  targetId: string;
  type:
    | 'parent' // Hierarchical decomposition - this is a parent of target
    | 'child' // Hierarchical decomposition - this is a child of target
    | 'derived_from' // Logical derivation, not strict hierarchy
    | 'depends_on' // Dependency
    | 'conflicts_with' // Mutual exclusivity
    | 'duplicates' // Redundancy or overlap (Similar To)
    | 'refines' // Adds detail without changing intent
    | 'satisfies' // Links to design or implementation (Implements)
    | 'verifies' // Links to test cases or validation
    | 'constrains' // Imposes restrictions on another requirement
    | 'requires' // Precondition for another requirement
    | 'related_to'; // Generic association for context
}

// Standalone link entity stored in links/ folder
export interface Link {
  id: string; // LINK-001, LINK-002, etc.
  sourceId: string; // The artifact creating the link (e.g., REQ-001)
  targetId: string; // The artifact being linked to (e.g., UC-003)
  type: LinkType; // Link relationship type
  projectIds: string[]; // Empty = global (all projects), populated = project-specific
  dateCreated: number;
  lastModified: number;
  customAttributes?: CustomAttributeValue[];
}
