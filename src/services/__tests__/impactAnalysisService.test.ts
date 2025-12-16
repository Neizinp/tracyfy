/**
 * Impact Analysis Service Tests
 */

import { describe, it, expect } from 'vitest';
import { impactAnalysisService, getImpactChain, getImpactSummary } from '../impactAnalysisService';
import type { Link } from '../../types';

describe('impactAnalysisService', () => {
  // Helper to create test links
  const createLink = (sourceId: string, targetId: string, type: string = 'depends_on'): Link => ({
    id: `LINK-${sourceId}-${targetId}`,
    sourceId,
    targetId,
    type: type as any,
    projectIds: [],
    dateCreated: Date.now(),
    lastModified: Date.now(),
  });

  describe('getImpactChain', () => {
    it('returns empty chain for artifact with no links', () => {
      const links: Link[] = [];
      const chain = getImpactChain('REQ-001', links);

      expect(chain.sourceId).toBe('REQ-001');
      expect(chain.nodes.length).toBe(0);
    });

    it('finds direct downstream dependencies', () => {
      const links: Link[] = [createLink('REQ-001', 'UC-001'), createLink('REQ-001', 'UC-002')];

      const chain = getImpactChain('REQ-001', links, 'downstream');

      expect(chain.nodes.length).toBe(2);
      expect(chain.nodes.map((n) => n.artifactId)).toContain('UC-001');
      expect(chain.nodes.map((n) => n.artifactId)).toContain('UC-002');
      expect(chain.nodes.every((n) => n.level === 1)).toBe(true);
    });

    it('finds direct upstream dependencies', () => {
      const links: Link[] = [createLink('REQ-001', 'UC-001'), createLink('REQ-002', 'UC-001')];

      const chain = getImpactChain('UC-001', links, 'upstream');

      expect(chain.nodes.length).toBe(2);
      expect(chain.nodes.map((n) => n.artifactId)).toContain('REQ-001');
      expect(chain.nodes.map((n) => n.artifactId)).toContain('REQ-002');
      expect(chain.nodes.every((n) => n.direction === 'upstream')).toBe(true);
    });

    it('traverses multi-level chains (transitive dependencies)', () => {
      const links: Link[] = [
        createLink('REQ-001', 'UC-001'),
        createLink('UC-001', 'TC-001'),
        createLink('TC-001', 'INFO-001'),
      ];

      const chain = getImpactChain('REQ-001', links, 'downstream');

      expect(chain.nodes.length).toBe(3);
      expect(chain.byLevel.get(1)?.map((n) => n.artifactId)).toContain('UC-001');
      expect(chain.byLevel.get(2)?.map((n) => n.artifactId)).toContain('TC-001');
      expect(chain.byLevel.get(3)?.map((n) => n.artifactId)).toContain('INFO-001');
    });

    it('respects maxDepth limit', () => {
      const links: Link[] = [
        createLink('REQ-001', 'UC-001'),
        createLink('UC-001', 'TC-001'),
        createLink('TC-001', 'INFO-001'),
      ];

      const chain = getImpactChain('REQ-001', links, 'downstream', 2);

      expect(chain.nodes.length).toBe(2);
      expect(chain.nodes.map((n) => n.artifactId)).toContain('UC-001');
      expect(chain.nodes.map((n) => n.artifactId)).toContain('TC-001');
      expect(chain.nodes.map((n) => n.artifactId)).not.toContain('INFO-001');
    });

    it('handles circular dependencies without infinite loop', () => {
      const links: Link[] = [
        createLink('REQ-001', 'UC-001'),
        createLink('UC-001', 'TC-001'),
        createLink('TC-001', 'REQ-001'), // Circular back to source
      ];

      const chain = getImpactChain('REQ-001', links, 'downstream');

      // Should not include the source again
      expect(chain.nodes.length).toBe(2);
      expect(chain.nodes.map((n) => n.artifactId)).not.toContain('REQ-001');
    });

    it('finds both directions when direction is "both"', () => {
      const links: Link[] = [
        createLink('REQ-001', 'UC-001'), // downstream from REQ-001
        createLink('REQ-002', 'REQ-001'), // upstream from REQ-001
      ];

      const chain = getImpactChain('REQ-001', links, 'both');

      expect(chain.nodes.length).toBe(2);
      expect(chain.nodes.find((n) => n.artifactId === 'UC-001')?.direction).toBe('downstream');
      expect(chain.nodes.find((n) => n.artifactId === 'REQ-002')?.direction).toBe('upstream');
    });
  });

  describe('getImpactSummary', () => {
    it('summarizes empty chain correctly', () => {
      const chain = getImpactChain('REQ-001', []);
      const summary = getImpactSummary(chain);

      expect(summary.total).toBe(0);
      expect(summary.upstream).toBe(0);
      expect(summary.downstream).toBe(0);
      expect(summary.maxDepth).toBe(0);
    });

    it('counts artifacts by type', () => {
      const links: Link[] = [
        createLink('REQ-001', 'UC-001'),
        createLink('REQ-001', 'UC-002'),
        createLink('REQ-001', 'TC-001'),
      ];

      const chain = getImpactChain('REQ-001', links, 'downstream');
      const summary = getImpactSummary(chain);

      expect(summary.total).toBe(3);
      expect(summary.byArtifactType['useCase']).toBe(2);
      expect(summary.byArtifactType['testCase']).toBe(1);
    });

    it('calculates max depth correctly', () => {
      const links: Link[] = [
        createLink('REQ-001', 'UC-001'),
        createLink('UC-001', 'TC-001'),
        createLink('TC-001', 'INFO-001'),
      ];

      const chain = getImpactChain('REQ-001', links, 'downstream');
      const summary = getImpactSummary(chain);

      expect(summary.maxDepth).toBe(3);
    });
  });

  describe('service exports', () => {
    it('exports all required functions', () => {
      expect(impactAnalysisService.getImpactChain).toBeDefined();
      expect(impactAnalysisService.getImpactSummary).toBeDefined();
      expect(impactAnalysisService.getAffectedArtifactIds).toBeDefined();
      expect(impactAnalysisService.getNodesAtLevel).toBeDefined();
    });
  });
});
