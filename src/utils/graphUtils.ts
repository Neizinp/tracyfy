import type { Node, Edge } from 'reactflow';
import type { UnifiedArtifact } from '../components/traceability';
import type { ArtifactType } from '../components/traceability';
import { TYPE_COLORS } from '../components/traceability';

export type LayoutAlgorithm = 'hierarchical' | 'force' | 'dagre';

export interface ArtifactNodeData {
  artifactId: string;
  title: string;
  artifactType: ArtifactType;
  linkCount: number;
  highlighted: boolean;
  isSelected: boolean;
}

export interface LinkEdgeData {
  linkType: string;
}

/**
 * Transform artifacts into React Flow nodes
 */
export function transformArtifactsToNodes(
  artifacts: UnifiedArtifact[],
  layout: LayoutAlgorithm = 'force',
  selectedNodeId: string | null = null,
  connectedNodeIds: Set<string> = new Set()
): Node<ArtifactNodeData>[] {
  const positions = calculateLayout(artifacts, layout);

  return artifacts.map((artifact, index) => ({
    id: artifact.id,
    type: 'artifact',
    position: positions[index] || { x: 0, y: 0 },
    data: {
      artifactId: artifact.id,
      title: artifact.title,
      artifactType: artifact.type,
      linkCount: artifact.linkedArtifacts.length,
      highlighted: connectedNodeIds.has(artifact.id),
      isSelected: artifact.id === selectedNodeId,
    },
  }));
}

/**
 * Transform links into React Flow edges
 */
export function transformLinksToEdges(
  links: {
    sourceId: string;
    targetId: string;
    type: string;
    sourceType: ArtifactType;
    targetType: ArtifactType;
  }[],
  selectedNodeId: string | null = null
): Edge<LinkEdgeData>[] {
  return links.map((link, index) => {
    const isConnectedToSelected =
      selectedNodeId !== null &&
      (link.sourceId === selectedNodeId || link.targetId === selectedNodeId);

    return {
      id: `edge-${link.sourceId}-${link.targetId}-${index}`,
      source: link.sourceId,
      target: link.targetId,
      label: link.type,
      type: 'smoothstep',
      animated: isConnectedToSelected,
      data: {
        linkType: link.type,
      },
      style: {
        stroke: isConnectedToSelected ? getLinkColor(link.type) : getLinkColor(link.type),
        strokeWidth: isConnectedToSelected ? 3 : 2,
        opacity: selectedNodeId !== null && !isConnectedToSelected ? 0.3 : 1,
      },
      labelStyle: {
        fontSize: '10px',
        fontWeight: isConnectedToSelected ? 600 : 500,
        fill: isConnectedToSelected ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
        opacity: selectedNodeId !== null && !isConnectedToSelected ? 0.3 : 1,
      },
    };
  });
}

/**
 * Calculate node positions based on layout algorithm
 */
function calculateLayout(
  artifacts: UnifiedArtifact[],
  algorithm: LayoutAlgorithm
): { x: number; y: number }[] {
  switch (algorithm) {
    case 'hierarchical':
      return calculateHierarchicalLayout(artifacts);
    case 'force':
      return calculateForceLayout(artifacts);
    case 'dagre':
      return calculateDagreLayout(artifacts);
    default:
      return calculateForceLayout(artifacts);
  }
}

/**
 * Hierarchical layout - arrange in tree structure
 */
function calculateHierarchicalLayout(artifacts: UnifiedArtifact[]): { x: number; y: number }[] {
  const positions: { x: number; y: number }[] = [];
  const nodeWidth = 250;
  const nodeHeight = 100;
  const horizontalSpacing = 50;
  const verticalSpacing = 150;

  // Group by artifact type for hierarchical levels
  const typeOrder: ArtifactType[] = ['requirement', 'useCase', 'testCase', 'information'];
  const grouped = new Map<ArtifactType, UnifiedArtifact[]>();

  typeOrder.forEach((type) => {
    grouped.set(
      type,
      artifacts.filter((a) => a.type === type)
    );
  });

  const currentY = 0;
  artifacts.forEach((artifact) => {
    const typeArtifacts = grouped.get(artifact.type) || [];
    const indexInType = typeArtifacts.indexOf(artifact);
    const typeIndex = typeOrder.indexOf(artifact.type);

    const x = indexInType * (nodeWidth + horizontalSpacing);
    const y = typeIndex * (nodeHeight + verticalSpacing);

    positions.push({ x, y: currentY + y });
  });

  return positions;
}

/**
 * Force-directed layout - physics-based positioning
 */
function calculateForceLayout(artifacts: UnifiedArtifact[]): { x: number; y: number }[] {
  const positions: { x: number; y: number }[] = [];
  const centerX = 400;
  const centerY = 300;
  const radius = 200;

  // Simple circular layout as a starting point
  artifacts.forEach((_artifact, index) => {
    const angle = (index / artifacts.length) * 2 * Math.PI;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    positions.push({ x, y });
  });

  return positions;
}

/**
 * Dagre layout - directed acyclic graph
 */
function calculateDagreLayout(artifacts: UnifiedArtifact[]): { x: number; y: number }[] {
  // For now, use hierarchical layout as a placeholder
  // In a full implementation, we'd use the dagre library
  return calculateHierarchicalLayout(artifacts);
}

/**
 * Get color for link type
 */
function getLinkColor(linkType: string): string {
  const colorMap: Record<string, string> = {
    parent: '#8b5cf6', // purple
    child: '#8b5cf6',
    derived_from: '#3b82f6', // blue
    depends_on: '#ef4444', // red
    conflicts_with: '#f59e0b', // amber
    duplicates: '#f97316', // orange
    refines: '#06b6d4', // cyan
    satisfies: '#10b981', // green
    verifies: '#22c55e', // green
    constrains: '#6366f1', // indigo
    requires: '#ec4899', // pink
    related_to: '#64748b', // slate
  };

  return colorMap[linkType] || '#64748b';
}

/**
 * Get node color based on artifact type
 */
export function getNodeColor(type: ArtifactType): { bg: string; border: string; text: string } {
  const colors = TYPE_COLORS[type];
  return {
    bg: colors.bg,
    border: colors.text,
    text: colors.text,
  };
}
