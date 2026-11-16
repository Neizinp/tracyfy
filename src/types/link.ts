import type { CustomAttributeValue } from './customAttributes';
import type { LinkType } from '../domain/linkTypes';

// Standalone link entity stored in links/ folder
export interface Link {
  id: string; // LINK-001, LINK-002, etc.
  sourceId: string; // The artifact creating the link (e.g., REQ-001)
  targetId: string; // The artifact being linked to (e.g., UC-003)
  type: LinkType; // Link relationship type
  dateCreated: number;
  lastModified: number;
  revision: string; // Satisfies BaseArtifact
  isDeleted?: boolean;
  deletedAt?: number;
  customAttributes?: CustomAttributeValue[];
}
