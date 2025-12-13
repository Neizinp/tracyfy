/**
 * Graph Utilities Tests
 *
 * Tests for transforming artifacts/links to React Flow nodes/edges
 * and layout calculation functions.
 */

import { describe, it, expect } from 'vitest';
import { transformArtifactsToNodes, transformLinksToEdges, getNodeColor } from '../graphUtils';
import type { UnifiedArtifact, ArtifactType } from '../../components/traceability';

describe('graphUtils', () => {
  // Common test data
  const createArtifact = (
    id: string,
    type: ArtifactType,
    title: string = 'Test',
    linkedArtifacts: string[] = []
  ): UnifiedArtifact => ({
    id,
    type,
    title,
    linkedArtifacts: linkedArtifacts.map((targetId) => ({ targetId, type: 'related_to' })),
  });

  describe('transformArtifactsToNodes', () => {
    it('should transform artifacts into React Flow nodes', () => {
      const artifacts: UnifiedArtifact[] = [
        createArtifact('REQ-001', 'requirement', 'First Requirement'),
        createArtifact('UC-001', 'useCase', 'First Use Case'),
      ];

      const nodes = transformArtifactsToNodes(artifacts);

      expect(nodes).toHaveLength(2);
      expect(nodes[0].id).toBe('REQ-001');
      expect(nodes[0].type).toBe('artifact');
      expect(nodes[0].data.artifactId).toBe('REQ-001');
      expect(nodes[0].data.title).toBe('First Requirement');
      expect(nodes[0].data.artifactType).toBe('requirement');
    });

    it('should set correct link count from linkedArtifacts', () => {
      const artifacts: UnifiedArtifact[] = [
        createArtifact('REQ-001', 'requirement', 'Requirement', ['UC-001', 'TC-001']),
      ];

      const nodes = transformArtifactsToNodes(artifacts);

      expect(nodes[0].data.linkCount).toBe(2);
    });

    it('should calculate node positions based on layout algorithm', () => {
      const artifacts: UnifiedArtifact[] = [
        createArtifact('REQ-001', 'requirement'),
        createArtifact('REQ-002', 'requirement'),
      ];

      const nodesForce = transformArtifactsToNodes(artifacts, 'force');
      const nodesHierarchical = transformArtifactsToNodes(artifacts, 'hierarchical');

      // Both should have positions
      expect(nodesForce[0].position).toBeDefined();
      expect(nodesForce[0].position.x).toBeDefined();
      expect(nodesForce[0].position.y).toBeDefined();
      expect(nodesHierarchical[0].position).toBeDefined();
    });

    it('should mark selected node correctly', () => {
      const artifacts: UnifiedArtifact[] = [
        createArtifact('REQ-001', 'requirement'),
        createArtifact('REQ-002', 'requirement'),
      ];

      const nodes = transformArtifactsToNodes(artifacts, 'force', 'REQ-001');

      expect(nodes[0].data.isSelected).toBe(true);
      expect(nodes[1].data.isSelected).toBe(false);
    });

    it('should highlight connected nodes when a node is selected', () => {
      const artifacts: UnifiedArtifact[] = [
        createArtifact('REQ-001', 'requirement'),
        createArtifact('REQ-002', 'requirement'),
        createArtifact('REQ-003', 'requirement'),
      ];

      const connectedNodeIds = new Set(['REQ-002']);
      const nodes = transformArtifactsToNodes(artifacts, 'force', 'REQ-001', connectedNodeIds);

      expect(nodes[0].data.isSelected).toBe(true);
      expect(nodes[0].data.highlighted).toBe(false);
      expect(nodes[1].data.highlighted).toBe(true);
      expect(nodes[2].data.highlighted).toBe(false);
    });

    it('should handle empty artifacts array', () => {
      const nodes = transformArtifactsToNodes([]);
      expect(nodes).toHaveLength(0);
    });

    it('should default to force layout when no algorithm is specified', () => {
      const artifacts: UnifiedArtifact[] = [createArtifact('REQ-001', 'requirement')];

      const nodes = transformArtifactsToNodes(artifacts);

      expect(nodes[0].position).toBeDefined();
    });
  });

  describe('transformLinksToEdges', () => {
    it('should transform links into React Flow edges', () => {
      const links = [
        {
          sourceId: 'REQ-001',
          targetId: 'UC-001',
          type: 'satisfies',
          sourceType: 'requirement' as ArtifactType,
          targetType: 'useCase' as ArtifactType,
        },
      ];

      const edges = transformLinksToEdges(links);

      expect(edges).toHaveLength(1);
      expect(edges[0].source).toBe('REQ-001');
      expect(edges[0].target).toBe('UC-001');
      expect(edges[0].label).toBe('satisfies');
      expect(edges[0].type).toBe('smoothstep');
    });

    it('should animate edges connected to selected node', () => {
      const links = [
        {
          sourceId: 'REQ-001',
          targetId: 'UC-001',
          type: 'satisfies',
          sourceType: 'requirement' as ArtifactType,
          targetType: 'useCase' as ArtifactType,
        },
        {
          sourceId: 'REQ-002',
          targetId: 'UC-002',
          type: 'related_to',
          sourceType: 'requirement' as ArtifactType,
          targetType: 'useCase' as ArtifactType,
        },
      ];

      const edges = transformLinksToEdges(links, 'REQ-001');

      expect(edges[0].animated).toBe(true); // Connected to selected
      expect(edges[1].animated).toBe(false); // Not connected
    });

    it('should set increased stroke width for selected edges', () => {
      const links = [
        {
          sourceId: 'REQ-001',
          targetId: 'UC-001',
          type: 'satisfies',
          sourceType: 'requirement' as ArtifactType,
          targetType: 'useCase' as ArtifactType,
        },
      ];

      const edges = transformLinksToEdges(links, 'REQ-001');

      expect(edges[0].style?.strokeWidth).toBe(3);
    });

    it('should reduce opacity for unconnected edges when a node is selected', () => {
      const links = [
        {
          sourceId: 'REQ-002',
          targetId: 'UC-002',
          type: 'related_to',
          sourceType: 'requirement' as ArtifactType,
          targetType: 'useCase' as ArtifactType,
        },
      ];

      const edges = transformLinksToEdges(links, 'REQ-001');

      expect(edges[0].style?.opacity).toBe(0.3);
    });

    it('should have full opacity when no node is selected', () => {
      const links = [
        {
          sourceId: 'REQ-001',
          targetId: 'UC-001',
          type: 'satisfies',
          sourceType: 'requirement' as ArtifactType,
          targetType: 'useCase' as ArtifactType,
        },
      ];

      const edges = transformLinksToEdges(links, null);

      expect(edges[0].style?.opacity).toBe(1);
    });

    it('should handle empty links array', () => {
      const edges = transformLinksToEdges([]);
      expect(edges).toHaveLength(0);
    });

    it('should generate unique edge IDs', () => {
      const links = [
        {
          sourceId: 'REQ-001',
          targetId: 'UC-001',
          type: 'satisfies',
          sourceType: 'requirement' as ArtifactType,
          targetType: 'useCase' as ArtifactType,
        },
        {
          sourceId: 'REQ-001',
          targetId: 'UC-001',
          type: 'depends_on',
          sourceType: 'requirement' as ArtifactType,
          targetType: 'useCase' as ArtifactType,
        },
      ];

      const edges = transformLinksToEdges(links);

      expect(edges[0].id).not.toBe(edges[1].id);
    });
  });

  describe('getNodeColor', () => {
    it('should return colors for requirement type', () => {
      const colors = getNodeColor('requirement');
      expect(colors.bg).toBeDefined();
      expect(colors.border).toBeDefined();
      expect(colors.text).toBeDefined();
    });

    it('should return colors for useCase type', () => {
      const colors = getNodeColor('useCase');
      expect(colors.bg).toBeDefined();
      expect(colors.border).toBeDefined();
      expect(colors.text).toBeDefined();
    });

    it('should return colors for testCase type', () => {
      const colors = getNodeColor('testCase');
      expect(colors.bg).toBeDefined();
      expect(colors.border).toBeDefined();
      expect(colors.text).toBeDefined();
    });

    it('should return colors for information type', () => {
      const colors = getNodeColor('information');
      expect(colors.bg).toBeDefined();
      expect(colors.border).toBeDefined();
      expect(colors.text).toBeDefined();
    });

    it('should return different colors for different artifact types', () => {
      const reqColors = getNodeColor('requirement');
      const ucColors = getNodeColor('useCase');
      const tcColors = getNodeColor('testCase');
      const infoColors = getNodeColor('information');

      // At least one property should differ between types
      expect(
        reqColors.bg !== ucColors.bg ||
          reqColors.border !== ucColors.border ||
          reqColors.text !== ucColors.text
      ).toBe(true);
      expect(
        tcColors.bg !== infoColors.bg ||
          tcColors.border !== infoColors.border ||
          tcColors.text !== infoColors.text
      ).toBe(true);
    });
  });

  describe('Layout Algorithms', () => {
    const artifacts: UnifiedArtifact[] = [
      createArtifact('REQ-001', 'requirement'),
      createArtifact('UC-001', 'useCase'),
      createArtifact('TC-001', 'testCase'),
      createArtifact('INFO-001', 'information'),
    ];

    it('should support hierarchical layout', () => {
      const nodes = transformArtifactsToNodes(artifacts, 'hierarchical');

      expect(nodes).toHaveLength(4);
      nodes.forEach((node) => {
        expect(typeof node.position.x).toBe('number');
        expect(typeof node.position.y).toBe('number');
      });
    });

    it('should support force layout', () => {
      const nodes = transformArtifactsToNodes(artifacts, 'force');

      expect(nodes).toHaveLength(4);
      nodes.forEach((node) => {
        expect(typeof node.position.x).toBe('number');
        expect(typeof node.position.y).toBe('number');
      });
    });

    it('should support dagre layout', () => {
      const nodes = transformArtifactsToNodes(artifacts, 'dagre');

      expect(nodes).toHaveLength(4);
      nodes.forEach((node) => {
        expect(typeof node.position.x).toBe('number');
        expect(typeof node.position.y).toBe('number');
      });
    });

    it('should produce different positions for different layouts', () => {
      const nodesForce = transformArtifactsToNodes(artifacts, 'force');
      const nodesHierarchical = transformArtifactsToNodes(artifacts, 'hierarchical');

      // At least one position should differ
      const positionsDiffer = nodesForce.some((node, i) => {
        const other = nodesHierarchical[i];
        return node.position.x !== other.position.x || node.position.y !== other.position.y;
      });

      expect(positionsDiffer).toBe(true);
    });
  });
});
