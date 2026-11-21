/**
 * Questions about the links between artifacts.
 *
 * Links are the only way to express a relation (DESIGN.md §3.3): no artifact
 * stores references to other artifacts. Anything that needs "which requirements
 * does this test case verify?" asks these functions with the project's links.
 *
 * Pure TypeScript: no React, no IO.
 */
import { isSymmetricType, type LinkType } from './linkTypes';
import { kindOfId } from './artifactKinds';

/** The part of a link these functions read */
export interface LinkEnds {
  sourceId: string;
  targetId: string;
  type: LinkType;
  isDeleted?: boolean;
}

/**
 * The artifacts that `id` relates to with `type`: "TC-001 verifies REQ-001"
 * gives REQ-001 for TC-001. A link is stored in one direction, so a directed
 * type is only read from its source; a symmetric one from both ends.
 * Sorted and without duplicates.
 */
export function linkedIds(links: readonly LinkEnds[], id: string, type: LinkType): string[] {
  const symmetric = isSymmetricType(type);
  const ids = new Set<string>();
  for (const link of links) {
    if (link.isDeleted || link.type !== type) continue;
    if (link.sourceId === id) ids.add(link.targetId);
    else if (symmetric && link.targetId === id) ids.add(link.sourceId);
  }
  return [...ids].sort();
}

/** How many links each artifact is an end of */
export function linkCounts(
  links: readonly Pick<LinkEnds, 'sourceId' | 'targetId' | 'isDeleted'>[]
): Map<string, number> {
  const counts = new Map<string, number>();
  const add = (id: string) => counts.set(id, (counts.get(id) ?? 0) + 1);
  for (const link of links) {
    if (link.isDeleted) continue;
    add(link.sourceId);
    if (link.targetId !== link.sourceId) add(link.targetId);
  }
  return counts;
}

/** The requirements a test case verifies */
export function verifiedRequirementIds(links: readonly LinkEnds[], testCaseId: string): string[] {
  return linkedIds(links, testCaseId, 'verifies').filter((id) => kindOfId(id) === 'requirement');
}
