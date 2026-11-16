/**
 * Questions about the links between artifacts.
 *
 * Links are the only way to express a relation (DESIGN.md §3.3): no artifact
 * stores references to other artifacts. Anything that needs "which requirements
 * does this test case verify?" asks these functions with the project's links.
 *
 * Pure TypeScript: no React, no IO.
 */
import { getInverseType, type LinkType } from './linkTypes';

/** The part of a link these functions read */
export interface LinkEnds {
  sourceId: string;
  targetId: string;
  type: LinkType;
  isDeleted?: boolean;
}

/**
 * The artifacts that `id` relates to with `type`, read from `id`'s side.
 *
 * A link can be stored from either end: "TC-001 verifies REQ-001" and
 * "REQ-001 verified_by TC-001" say the same thing. Both count, so the answer
 * does not depend on which artifact the link was created from.
 * Sorted and without duplicates.
 */
export function linkedIds(links: readonly LinkEnds[], id: string, type: LinkType): string[] {
  const inverse = getInverseType(type);
  const ids = new Set<string>();
  for (const link of links) {
    if (link.isDeleted) continue;
    if (link.sourceId === id && link.type === type) ids.add(link.targetId);
    if (link.targetId === id && link.type === inverse) ids.add(link.sourceId);
  }
  return [...ids].sort();
}

/** How many links each artifact is an end of */
export function linkCounts(links: readonly LinkEnds[]): Map<string, number> {
  const counts = new Map<string, number>();
  const add = (id: string) => counts.set(id, (counts.get(id) ?? 0) + 1);
  for (const link of links) {
    if (link.isDeleted) continue;
    add(link.sourceId);
    if (link.targetId !== link.sourceId) add(link.targetId);
  }
  return counts;
}
