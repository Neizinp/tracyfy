/**
 * Impact Analysis Service
 *
 * Computes transitive impact chains - "what's affected if I change this artifact?"
 * Uses BFS traversal to find all downstream/upstream dependencies.
 */

import type { Link } from '../types';

export type ImpactDirection = 'upstream' | 'downstream' | 'both';

export interface ImpactNode {
  artifactId: string;
  level: number; // Distance from source (0 = source itself)
  direction: 'upstream' | 'downstream';
  linkType: string;
  parentId: string | null; // Which artifact this was reached from
}

export interface ImpactChain {
  sourceId: string;
  nodes: ImpactNode[];
  byLevel: Map<number, ImpactNode[]>;
  byType: Map<string, ImpactNode[]>; // Grouped by artifact type prefix (REQ, UC, TC, etc.)
}

export interface ImpactSummary {
  total: number;
  upstream: number;
  downstream: number;
  byArtifactType: Record<string, number>;
  maxDepth: number;
}

/**
 * Build adjacency map from links for efficient traversal
 */
function buildAdjacencyMap(links: Link[]): {
  outgoing: Map<string, { targetId: string; type: string }[]>;
  incoming: Map<string, { sourceId: string; type: string }[]>;
} {
  const outgoing = new Map<string, { targetId: string; type: string }[]>();
  const incoming = new Map<string, { sourceId: string; type: string }[]>();

  links.forEach((link) => {
    // Outgoing: source → target
    if (!outgoing.has(link.sourceId)) {
      outgoing.set(link.sourceId, []);
    }
    outgoing.get(link.sourceId)!.push({ targetId: link.targetId, type: link.type });

    // Incoming: target ← source
    if (!incoming.has(link.targetId)) {
      incoming.set(link.targetId, []);
    }
    incoming.get(link.targetId)!.push({ sourceId: link.sourceId, type: link.type });
  });

  return { outgoing, incoming };
}

/**
 * Get artifact type from ID prefix
 */
function getArtifactTypeFromId(id: string): string {
  if (id.startsWith('REQ-')) return 'requirement';
  if (id.startsWith('UC-')) return 'useCase';
  if (id.startsWith('TC-')) return 'testCase';
  if (id.startsWith('INFO-')) return 'information';
  if (id.startsWith('RSK-')) return 'risk';
  return 'unknown';
}

/**
 * Compute the full impact chain for a given artifact
 *
 * @param sourceId - The artifact to analyze
 * @param links - All links in the system
 * @param direction - Which direction to traverse
 * @param maxDepth - Maximum depth to traverse (0 = unlimited)
 */
export function getImpactChain(
  sourceId: string,
  links: Link[],
  direction: ImpactDirection = 'both',
  maxDepth: number = 0
): ImpactChain {
  const { outgoing, incoming } = buildAdjacencyMap(links);
  const visited = new Set<string>();
  const nodes: ImpactNode[] = [];
  const byLevel = new Map<number, ImpactNode[]>();
  const byType = new Map<string, ImpactNode[]>();

  // BFS queue: [artifactId, level, direction, linkType, parentId]
  type QueueItem = [string, number, 'upstream' | 'downstream', string, string | null];
  const queue: QueueItem[] = [];

  visited.add(sourceId);

  // Initialize queue based on direction
  if (direction === 'downstream' || direction === 'both') {
    const downstreamLinks = outgoing.get(sourceId) || [];
    downstreamLinks.forEach((link) => {
      if (!visited.has(link.targetId)) {
        queue.push([link.targetId, 1, 'downstream', link.type, sourceId]);
      }
    });
  }

  if (direction === 'upstream' || direction === 'both') {
    const upstreamLinks = incoming.get(sourceId) || [];
    upstreamLinks.forEach((link) => {
      if (!visited.has(link.sourceId)) {
        queue.push([link.sourceId, 1, 'upstream', link.type, sourceId]);
      }
    });
  }

  // BFS traversal
  while (queue.length > 0) {
    const [artifactId, level, dir, linkType, parentId] = queue.shift()!;

    if (visited.has(artifactId)) continue;
    if (maxDepth > 0 && level > maxDepth) continue;

    visited.add(artifactId);

    const node: ImpactNode = {
      artifactId,
      level,
      direction: dir,
      linkType,
      parentId,
    };
    nodes.push(node);

    // Add to byLevel map
    if (!byLevel.has(level)) {
      byLevel.set(level, []);
    }
    byLevel.get(level)!.push(node);

    // Add to byType map
    const artifactType = getArtifactTypeFromId(artifactId);
    if (!byType.has(artifactType)) {
      byType.set(artifactType, []);
    }
    byType.get(artifactType)!.push(node);

    // Continue traversal in same direction
    if (dir === 'downstream') {
      const nextLinks = outgoing.get(artifactId) || [];
      nextLinks.forEach((link) => {
        if (!visited.has(link.targetId)) {
          queue.push([link.targetId, level + 1, 'downstream', link.type, artifactId]);
        }
      });
    } else {
      const nextLinks = incoming.get(artifactId) || [];
      nextLinks.forEach((link) => {
        if (!visited.has(link.sourceId)) {
          queue.push([link.sourceId, level + 1, 'upstream', link.type, artifactId]);
        }
      });
    }
  }

  return {
    sourceId,
    nodes,
    byLevel,
    byType,
  };
}

/**
 * Get summary statistics for impact analysis
 */
export function getImpactSummary(chain: ImpactChain): ImpactSummary {
  const byArtifactType: Record<string, number> = {};
  let maxDepth = 0;
  let upstream = 0;
  let downstream = 0;

  chain.nodes.forEach((node) => {
    const type = getArtifactTypeFromId(node.artifactId);
    byArtifactType[type] = (byArtifactType[type] || 0) + 1;

    if (node.level > maxDepth) maxDepth = node.level;

    if (node.direction === 'upstream') upstream++;
    else downstream++;
  });

  return {
    total: chain.nodes.length,
    upstream,
    downstream,
    byArtifactType,
    maxDepth,
  };
}

/**
 * Get list of affected artifact IDs
 */
export function getAffectedArtifactIds(chain: ImpactChain): string[] {
  return chain.nodes.map((n) => n.artifactId);
}

/**
 * Get nodes at a specific depth level
 */
export function getNodesAtLevel(chain: ImpactChain, level: number): ImpactNode[] {
  return chain.byLevel.get(level) || [];
}

export const impactAnalysisService = {
  getImpactChain,
  getImpactSummary,
  getAffectedArtifactIds,
  getNodesAtLevel,
};
