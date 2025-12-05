import { describe, it, expect } from 'vitest';
import type { Requirement, Link } from '../../types';

describe('Link Validation Logic', () => {
  describe('Circular Dependency Detection', () => {
    it('should detect direct circular dependencies', () => {
      const requirements: Pick<Requirement, 'id' | 'parentIds'>[] = [
        { id: 'REQ-001', parentIds: ['REQ-002'] },
        { id: 'REQ-002', parentIds: ['REQ-001'] },
      ];

      const hasCircularDependency = (): boolean => {
        const visited = new Set<string>();
        const recursionStack = new Set<string>();

        const dfs = (id: string): boolean => {
          if (recursionStack.has(id)) return true;
          if (visited.has(id)) return false;

          visited.add(id);
          recursionStack.add(id);

          const req = requirements.find((r) => r.id === id);
          if (req) {
            for (const parentId of req.parentIds) {
              if (dfs(parentId)) return true;
            }
          }

          recursionStack.delete(id);
          return false;
        };

        return requirements.some((req) => dfs(req.id));
      };

      expect(hasCircularDependency()).toBe(true);
    });

    it('should detect indirect circular dependencies', () => {
      const requirements: Pick<Requirement, 'id' | 'parentIds'>[] = [
        { id: 'REQ-001', parentIds: ['REQ-002'] },
        { id: 'REQ-002', parentIds: ['REQ-003'] },
        { id: 'REQ-003', parentIds: ['REQ-001'] },
      ];

      const hasCircularDependency = (): boolean => {
        const visited = new Set<string>();
        const recursionStack = new Set<string>();

        const dfs = (id: string): boolean => {
          if (recursionStack.has(id)) return true;
          if (visited.has(id)) return false;

          visited.add(id);
          recursionStack.add(id);

          const req = requirements.find((r) => r.id === id);
          if (req) {
            for (const parentId of req.parentIds) {
              if (dfs(parentId)) return true;
            }
          }

          recursionStack.delete(id);
          return false;
        };

        return requirements.some((req) => dfs(req.id));
      };

      expect(hasCircularDependency()).toBe(true);
    });

    it('should not report false positives for valid hierarchies', () => {
      const requirements: Pick<Requirement, 'id' | 'parentIds'>[] = [
        { id: 'REQ-001', parentIds: [] },
        { id: 'REQ-002', parentIds: ['REQ-001'] },
        { id: 'REQ-003', parentIds: ['REQ-002'] },
      ];

      const hasCircularDependency = (): boolean => {
        const visited = new Set<string>();
        const recursionStack = new Set<string>();

        const dfs = (id: string): boolean => {
          if (recursionStack.has(id)) return true;
          if (visited.has(id)) return false;

          visited.add(id);
          recursionStack.add(id);

          const req = requirements.find((r) => r.id === id);
          if (req) {
            for (const parentId of req.parentIds) {
              if (dfs(parentId)) return true;
            }
          }

          recursionStack.delete(id);
          return false;
        };

        return requirements.some((req) => dfs(req.id));
      };

      expect(hasCircularDependency()).toBe(false);
    });

    it('should detect self-references', () => {
      const requirements: Pick<Requirement, 'id' | 'parentIds'>[] = [
        { id: 'REQ-001', parentIds: ['REQ-001'] },
      ];

      const hasSelfReference = requirements.some((req) => req.parentIds.includes(req.id));

      expect(hasSelfReference).toBe(true);
    });
  });

  describe('Orphaned Links Detection', () => {
    it('should detect links to deleted artifacts', () => {
      const requirements = [
        { id: 'REQ-001', isDeleted: false },
        { id: 'REQ-002', isDeleted: true },
      ];

      const links: Pick<Link, 'sourceId' | 'targetId'>[] = [
        { sourceId: 'REQ-001', targetId: 'REQ-002' },
      ];

      const orphanedLinks = links.filter((link) => {
        const source = requirements.find((r) => r.id === link.sourceId);
        const target = requirements.find((r) => r.id === link.targetId);
        return source?.isDeleted || target?.isDeleted;
      });

      expect(orphanedLinks).toHaveLength(1);
    });

    it('should detect links to non-existent artifacts', () => {
      const requirements = [{ id: 'REQ-001' }, { id: 'REQ-002' }];

      const links: Pick<Link, 'sourceId' | 'targetId'>[] = [
        { sourceId: 'REQ-001', targetId: 'REQ-999' },
      ];

      const validIds = new Set(requirements.map((r) => r.id));
      const orphanedLinks = links.filter(
        (link) => !validIds.has(link.sourceId) || !validIds.has(link.targetId)
      );

      expect(orphanedLinks).toHaveLength(1);
    });

    it('should find all links for a specific artifact', () => {
      const links: Pick<Link, 'id' | 'sourceId' | 'targetId'>[] = [
        { id: 'link1', sourceId: 'REQ-001', targetId: 'REQ-002' },
        { id: 'link2', sourceId: 'REQ-002', targetId: 'REQ-003' },
        { id: 'link3', sourceId: 'REQ-003', targetId: 'REQ-001' },
      ];

      const artifactId = 'REQ-001';
      const relatedLinks = links.filter(
        (link) => link.sourceId === artifactId || link.targetId === artifactId
      );

      expect(relatedLinks).toHaveLength(2);
      expect(relatedLinks.map((l) => l.id)).toContain('link1');
      expect(relatedLinks.map((l) => l.id)).toContain('link3');
    });
  });

  describe('Link Integrity', () => {
    it('should validate link types', () => {
      const validLinkTypes = ['relates_to', 'depends_on', 'conflicts_with'];
      const testLinks = [{ type: 'relates_to' }, { type: 'invalid_type' }];

      const isValidType = (type: string): boolean => validLinkTypes.includes(type);

      expect(isValidType(testLinks[0].type)).toBe(true);
      expect(isValidType(testLinks[1].type)).toBe(false);
    });

    it('should prevent duplicate links', () => {
      const links: Pick<Link, 'sourceId' | 'targetId' | 'type'>[] = [
        { sourceId: 'REQ-001', targetId: 'REQ-002', type: 'relates_to' },
      ];

      const newLink = { sourceId: 'REQ-001', targetId: 'REQ-002', type: 'relates_to' };

      const isDuplicate = links.some(
        (existing) =>
          existing.sourceId === newLink.sourceId &&
          existing.targetId === newLink.targetId &&
          existing.type === newLink.type
      );

      expect(isDuplicate).toBe(true);
    });

    it('should handle bidirectional link checking', () => {
      const links: Pick<Link, 'sourceId' | 'targetId' | 'type'>[] = [
        { sourceId: 'REQ-001', targetId: 'REQ-002', type: 'relates_to' },
      ];

      // Check if a reverse link exists
      const hasReverseLink = (sourceId: string, targetId: string): boolean => {
        return links.some((link) => link.sourceId === targetId && link.targetId === sourceId);
      };

      expect(hasReverseLink('REQ-001', 'REQ-002')).toBe(false);

      // Add reverse link
      links.push({ sourceId: 'REQ-002', targetId: 'REQ-001', type: 'relates_to' });
      expect(hasReverseLink('REQ-001', 'REQ-002')).toBe(true);
    });
  });

  describe('Link Cleanup', () => {
    it('should identify links to remove when artifact is deleted', () => {
      const links: Pick<Link, 'id' | 'sourceId' | 'targetId'>[] = [
        { id: 'link1', sourceId: 'REQ-001', targetId: 'REQ-002' },
        { id: 'link2', sourceId: 'REQ-002', targetId: 'REQ-003' },
        { id: 'link3', sourceId: 'REQ-003', targetId: 'REQ-001' },
      ];

      const deletedArtifactId = 'REQ-002';
      const linksToRemove = links.filter(
        (link) => link.sourceId === deletedArtifactId || link.targetId === deletedArtifactId
      );

      expect(linksToRemove).toHaveLength(2);
      expect(linksToRemove.map((l) => l.id)).toContain('link1');
      expect(linksToRemove.map((l) => l.id)).toContain('link2');
    });

    it('should cascade parent removal from children', () => {
      const requirements: Pick<Requirement, 'id' | 'parentIds'>[] = [
        { id: 'REQ-001', parentIds: [] },
        { id: 'REQ-002', parentIds: ['REQ-001'] },
        { id: 'REQ-003', parentIds: ['REQ-001', 'REQ-002'] },
      ];

      const deletedId = 'REQ-001';

      requirements.forEach((req) => {
        req.parentIds = req.parentIds.filter((pid) => pid !== deletedId);
      });

      const req2 = requirements.find((r) => r.id === 'REQ-002');
      const req3 = requirements.find((r) => r.id === 'REQ-003');

      expect(req2?.parentIds).toHaveLength(0);
      expect(req3?.parentIds).toHaveLength(1);
      expect(req3?.parentIds).toContain('REQ-002');
    });
  });
});
